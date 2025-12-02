use std::collections::VecDeque;
use std::io;
use std::io::Write;
use std::path::Path;
use std::str::from_utf8;

use lopdf::content::{Content, Operation};
use lopdf::{Document, Object, ObjectId, StringFormat};

use crate::pdf_utils::*;
use derive_error::Error;

/// A PDF Form that contains fillable fields
///
/// Use this struct to load an existing PDF with a fillable form using the `load` method.  It will
/// analyze the PDF and identify the fields. Then you can get and set the content of the fields by
/// index.
pub struct Form {
    pub document: Document,
    form_ids: Vec<ObjectId>,
}

/// The possible types of fillable form fields in a PDF
#[derive(Debug)]
pub enum FieldType {
    Button,
    Radio,
    CheckBox,
    ListBox,
    ComboBox,
    Text,
    Unknown,
}

#[derive(Debug, Error)]
/// Errors that may occur while loading a PDF
pub enum LoadError {
    /// An Lopdf Error
    LopdfError(lopdf::Error),
    /// The reference `ObjectId` did not point to any values
    #[error(non_std, no_from)]
    NoSuchReference(ObjectId),
    /// An element that was expected to be a reference was not a reference
    NotAReference,
}

/// Errors That may occur while setting values in a form
#[derive(Debug, Error)]
pub enum ValueError {
    /// The method used to set the state is incompatible with the type of the field
    TypeMismatch,
    /// One or more selected values are not valid choices
    InvalidSelection,
    /// Multiple values were selected when only one was allowed
    TooManySelected,
    /// Readonly field cannot be edited
    Readonly,
    /// Field not found
    NotFound,
}

/// The current state of a form field
#[derive(Debug)]
pub enum FieldState {
    /// Push buttons have no state
    Button,
    /// `selected` is the singular option from `options` that is selected
    Radio {
        selected: String,
        options: Vec<String>,
        readonly: bool,
        required: bool,
    },
    /// The toggle state of the checkbox
    CheckBox {
        is_checked: bool,
        readonly: bool,
        required: bool,
    },
    /// `selected` is the list of selected options from `options`
    ListBox {
        selected: Vec<String>,
        options: Vec<String>,
        multiselect: bool,
        readonly: bool,
        required: bool,
    },
    /// `selected` is the list of selected options from `options`
    ComboBox {
        selected: Vec<String>,
        options: Vec<String>,
        editable: bool,
        readonly: bool,
        required: bool,
    },
    /// User Text Input
    Text {
        text: String,
        readonly: bool,
        required: bool,
    },
    /// Unknown fields have no state
    Unknown,
}

trait PdfObjectDeref {
    fn deref<'a>(&self, doc: &'a Document) -> Result<&'a Object, LoadError>;
}

impl PdfObjectDeref for Object {
    fn deref<'a>(&self, doc: &'a Document) -> Result<&'a Object, LoadError> {
        match *self {
            Object::Reference(oid) => doc.objects.get(&oid).ok_or(LoadError::NoSuchReference(oid)),
            _ => Err(LoadError::NotAReference),
        }
    }
}

impl Form {
    /// Takes a reader containing a PDF with a fillable form, analyzes the content, and attempts to
    /// identify all of the fields the form has.
    pub fn load_from<R: io::Read>(reader: R) -> Result<Self, LoadError> {
        let doc = Document::load_from(reader)?;
        Self::load_doc(doc)
    }

    /// Takes a path to a PDF with a fillable form, analyzes the file, and attempts to identify all
    /// of the fields the form has.
    pub fn load<P: AsRef<Path>>(path: P) -> Result<Self, LoadError> {
        let doc = Document::load(path)?;
        Self::load_doc(doc)
    }

    fn load_doc(mut document: Document) -> Result<Self, LoadError> {
        let mut form_ids = Vec::new();
        let mut queue = VecDeque::new();
        // Block so borrow of doc ends before doc is moved into the result
        {
            let acroform = document
                .objects
                .get_mut(
                    &document
                        .trailer
                        .get(b"Root")?
                        .deref(&document)?
                        .as_dict()?
                        .get(b"AcroForm")?
                        .as_reference()?,
                )
                .ok_or(LoadError::NotAReference)?
                .as_dict_mut()?;

            let fields_list = acroform.get(b"Fields")?.as_array()?;
            queue.append(&mut VecDeque::from(fields_list.clone()));

            // Iterate over the fields
            while let Some(objref) = queue.pop_front() {
                let obj = objref.deref(&document)?;
                if let Object::Dictionary(ref dict) = *obj {
                    // If the field has FT, it actually takes input.  Save this
                    if dict.get(b"FT").is_ok() {
                        form_ids.push(objref.as_reference().unwrap());
                    }

                    // If this field has kids, they might have FT, so add them to the queue
                    if let Ok(&Object::Array(ref kids)) = dict.get(b"Kids") {
                        queue.append(&mut VecDeque::from(kids.clone()));
                    }
                }
            }
        }
        Ok(Form { document, form_ids })
    }

    /// Returns the number of fields the form has
    pub fn len(&self) -> usize {
        self.form_ids.len()
    }

    /// Returns true if empty
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    /// Gets the type of field of the given index
    ///
    /// # Panics
    /// This function will panic if the index is greater than the number of fields
    pub fn get_type(&self, n: usize) -> FieldType {
        // unwraps should be fine because load should have verified everything exists
        let field = self
            .document
            .objects
            .get(&self.form_ids[n])
            .unwrap()
            .as_dict()
            .unwrap();

        match field.get(b"FT").unwrap() {
            Object::Name(name) if name == b"Btn" => {
                let flags = ButtonFlags::from_bits_truncate(get_field_flags(field));
                if flags.intersects(ButtonFlags::RADIO | ButtonFlags::NO_TOGGLE_TO_OFF) {
                    FieldType::Radio
                } else if flags.intersects(ButtonFlags::PUSHBUTTON) {
                    FieldType::Button
                } else {
                    FieldType::CheckBox
                }
            }
            Object::Name(name) if name == b"Ch" => {
                let flags = ChoiceFlags::from_bits_truncate(get_field_flags(field));
                if flags.intersects(ChoiceFlags::COBMO) {
                    FieldType::ComboBox
                } else {
                    FieldType::ListBox
                }
            }
            Object::Name(name) if name == b"Tx" => FieldType::Text,
            _ => FieldType::Unknown,
        }
    }

    /// Gets the name of field of the given index
    ///
    /// # Panics
    /// This function will panic if the index is greater than the number of fields
    pub fn get_name(&self, n: usize) -> Option<String> {
        // unwraps should be fine because load should have verified everything exists
        let field = self
            .document
            .objects
            .get(&self.form_ids[n])
            .unwrap()
            .as_dict()
            .unwrap();

        // The "T" key refers to the name of the field
        match field.get(b"T") {
            Ok(&Object::String(ref data, _)) => Some(decode_pdf_string(data)),
            _ => None,
        }
    }

    /// Gets the types of all of the fields in the form
    pub fn get_all_types(&self) -> Vec<FieldType> {
        let mut res = Vec::with_capacity(self.len());
        for i in 0..self.len() {
            res.push(self.get_type(i))
        }
        res
    }

    /// Gets the names of all of the fields in the form
    pub fn get_all_names(&self) -> Vec<Option<String>> {
        let mut res = Vec::with_capacity(self.len());
        for i in 0..self.len() {
            res.push(self.get_name(i))
        }
        res
    }

    /// Gets the state of field of the given index
    ///
    /// # Panics
    /// This function will panic if the index is greater than the number of fields
    pub fn get_state(&self, n: usize) -> FieldState {
        let field = self
            .document
            .objects
            .get(&self.form_ids[n])
            .unwrap()
            .as_dict()
            .unwrap();
        match self.get_type(n) {
            FieldType::Button => FieldState::Button,
            FieldType::Radio => FieldState::Radio {
                selected: field
                    .get(b"V")
                    .ok()
                    .and_then(name_to_string)
                    .or_else(|| field.get(b"AS").ok().and_then(name_to_string))
                    .unwrap_or_default(),
                options: self.get_possibilities(self.form_ids[n]),
                readonly: is_read_only(field),
                required: is_required(field),
            },
            FieldType::CheckBox => FieldState::CheckBox {
                is_checked: field
                    .get(b"V")
                    .ok()
                    .or_else(|| field.get(b"AS").ok())
                    .map(|name| matches!(name, Object::Name(ref n) if n == b"Yes"))
                    .unwrap_or(false),
                readonly: is_read_only(field),
                required: is_required(field),
            },
            FieldType::ListBox => FieldState::ListBox {
                // V field in a list box can be either text for one option, an array for many
                // options, or null
                selected: field
                    .get(b"V")
                    .ok()
                    .map(|selection| match selection {
                        Object::String(_, _) => string_from_pdf_object(selection)
                            .map(|value| vec![value])
                            .unwrap_or_default(),
                        Object::Array(chosen) => {
                            chosen.iter().filter_map(string_from_pdf_object).collect()
                        }
                        _ => Vec::new(),
                    })
                    .unwrap_or_default(),
                // The options is an array of either text elements or arrays where the second
                // element is what we want
                options: field
                    .get(b"Opt")
                    .ok()
                    .and_then(|options| match options {
                        Object::Array(entries) => Some(
                            entries
                                .iter()
                                .map(|entry| match entry {
                                    Object::String(_, _) => {
                                        string_from_pdf_object(entry).unwrap_or_default()
                                    }
                                    Object::Array(arr) => arr
                                        .get(1)
                                        .and_then(string_from_pdf_object)
                                        .unwrap_or_default(),
                                    _ => String::new(),
                                })
                                .filter(|value| !value.is_empty())
                                .collect(),
                        ),
                        _ => None,
                    })
                    .unwrap_or_default(),
                multiselect: {
                    let flags = ChoiceFlags::from_bits_truncate(get_field_flags(field));
                    flags.intersects(ChoiceFlags::MULTISELECT)
                },
                readonly: is_read_only(field),
                required: is_required(field),
            },
            FieldType::ComboBox => FieldState::ComboBox {
                // V field in a list box can be either text for one option, an array for many
                // options, or null
                selected: field
                    .get(b"V")
                    .ok()
                    .map(|selection| match selection {
                        Object::String(_, _) => string_from_pdf_object(selection)
                            .map(|value| vec![value])
                            .unwrap_or_default(),
                        Object::Array(chosen) => {
                            chosen.iter().filter_map(string_from_pdf_object).collect()
                        }
                        _ => Vec::new(),
                    })
                    .unwrap_or_default(),
                // The options is an array of either text elements or arrays where the second
                // element is what we want
                options: field
                    .get(b"Opt")
                    .ok()
                    .and_then(|options| match options {
                        Object::Array(entries) => Some(
                            entries
                                .iter()
                                .map(|entry| match entry {
                                    Object::String(_, _) => {
                                        string_from_pdf_object(entry).unwrap_or_default()
                                    }
                                    Object::Array(arr) => arr
                                        .get(1)
                                        .and_then(string_from_pdf_object)
                                        .unwrap_or_default(),
                                    _ => String::new(),
                                })
                                .filter(|value| !value.is_empty())
                                .collect(),
                        ),
                        _ => None,
                    })
                    .unwrap_or_default(),
                editable: {
                    let flags = ChoiceFlags::from_bits_truncate(get_field_flags(field));

                    flags.intersects(ChoiceFlags::EDIT)
                },
                readonly: is_read_only(field),
                required: is_required(field),
            },
            FieldType::Text => FieldState::Text {
                text: field
                    .get(b"V")
                    .ok()
                    .and_then(string_from_pdf_object)
                    .unwrap_or_default(),
                readonly: is_read_only(field),
                required: is_required(field),
            },
            FieldType::Unknown => FieldState::Unknown,
        }
    }

    /// Gets the object of field of the given index
    ///
    /// # Panics
    /// Will panic if n is larger than the number of fields
    pub fn get_object_id(&self, n: usize) -> ObjectId {
        self.form_ids[n]
    }

    /// If the field at index `n` is a text field, fills in that field with the text `s`.
    /// If it is not a text field, returns ValueError
    ///
    /// # Panics
    /// Will panic if n is larger than the number of fields
    pub fn set_text(&mut self, n: usize, s: String) -> Result<(), ValueError> {
        match self.get_state(n) {
            FieldState::Text { .. } => {
                let field = self
                    .document
                    .objects
                    .get_mut(&self.form_ids[n])
                    .unwrap()
                    .as_dict_mut()
                    .unwrap();

                let encoded = encode_pdf_string(&s);
                field.set("V", Object::String(encoded, StringFormat::Literal));

                // Remove existing appearance streams so the viewer regenerates them from the
                // newly assigned value. Any errors here can be ignored safely.
                let _ = self.clear_field_appearance(self.form_ids[n]);

                Ok(())
            }
            _ => Err(ValueError::TypeMismatch),
        }
    }

    /// Regenerates the appearance for the field at index `n` due to an alteration of the
    /// original TextField value, the AP will be updated accordingly.
    ///
    /// # Incomplete
    /// This function is not exhaustive as not parse the original TextField orientation
    /// or the text alignment and other kind of enrichments, also doesn't discover for
    /// the global document DA.
    ///
    /// A more sophisticated parser is needed here
    fn regenerate_text_appearance(&mut self, n: usize) -> Result<(), lopdf::Error> {
        let field = {
            self.document
                .objects
                .get(&self.form_ids[n])
                .unwrap()
                .as_dict()
                .unwrap()
        };

        // The value of the object (should be a string)
        let value = field.get(b"V")?.to_owned();
        let decoded_value = string_from_pdf_object(&value).unwrap_or_default();
        let lines: Vec<&str> = decoded_value.split('\n').collect();

        // The default appearance of the object (should be a string)
        let da = field.get(b"DA")?.to_owned();

        // The default appearance of the object (should be a string)
        let rect = field
            .get(b"Rect")?
            .as_array()?
            .iter()
            .map(|object| match object {
                Object::Real(value) => *value as f32,
                Object::Integer(value) => *value as f32,
                _ => 0.0,
            })
            .collect::<Vec<_>>();

        // Gets the object stream
        let object_id = field.get(b"AP")?.as_dict()?.get(b"N")?.as_reference()?;
        let stream = self.document.get_object_mut(object_id)?.as_stream_mut()?;

        // Decode and get the content, even if is compressed
        let mut content = {
            if let Ok(content) = stream.decompressed_content() {
                Content::decode(&content)?
            } else {
                Content::decode(&stream.content)?
            }
        };

        // Ignored operators
        let ignored_operators = vec![
            "bt", "tc", "tw", "tz", "g", "tm", "tr", "tf", "tj", "et", "q", "bmc", "emc",
        ];

        // Remove these ignored operators as we have to generate the text and fonts again
        content.operations.retain(|operation| {
            !ignored_operators.contains(&operation.operator.to_lowercase().as_str())
        });

        // Let's construct the text widget
        content.operations.append(&mut vec![
            Operation::new("BMC", vec!["Tx".into()]),
            Operation::new("q", vec![]),
            Operation::new("BT", vec![]),
        ]);

        let font = parse_font(match da {
            Object::String(ref bytes, _) => from_utf8(bytes).ok(),
            _ => None,
        });

        // Define some helping font variables
        let font_name = (font.0).0;
        let font_size = (font.0).1;
        let font_color = font.1;

        // Set the font type and size and color
        content.operations.append(&mut vec![
            Operation::new("Tf", vec![font_name.into(), font_size.into()]),
            Operation::new(
                font_color.0,
                match font_color.0 {
                    "k" => vec![
                        font_color.1.into(),
                        font_color.2.into(),
                        font_color.3.into(),
                        font_color.4.into(),
                    ],
                    "rg" => vec![
                        font_color.1.into(),
                        font_color.2.into(),
                        font_color.3.into(),
                    ],
                    _ => vec![font_color.1.into()],
                },
            ),
        ]);

        // Calculate the text offset
        let x = 2.0; // Small padding from the left border
        let height = (rect[3] - rect[1]).abs();
        let mut y = if height > 0.0 {
            height - (font_size as f32 * 1.1)
        } else {
            font_size as f32 * 0.5
        };
        if y < 0.0 {
            y = font_size.max(1) as f32 * 0.2;
        }

        // Set the text bounds, first are fixed at "1 0 0 1" and then the calculated x,y
        content.operations.append(&mut vec![Operation::new(
            "Tm",
            vec![1.into(), 0.into(), 0.into(), 1.into(), x.into(), y.into()],
        )]);

        let leading = (font_size.max(1) as f32 * 1.2).into();
        content.operations.push(Operation::new("TL", vec![leading]));

        let mut line_iter = lines.iter();
        if let Some(first_line) = line_iter.next() {
            let encoded = encode_pdf_string(first_line);
            content.operations.push(Operation::new(
                "Tj",
                vec![Object::String(encoded, StringFormat::Literal)],
            ));
        }

        for line in line_iter {
            content.operations.push(Operation::new("T*", vec![]));
            let encoded = encode_pdf_string(line);
            content.operations.push(Operation::new(
                "Tj",
                vec![Object::String(encoded, StringFormat::Literal)],
            ));
        }

        // Set the text value and some finalizing operations
        content.operations.append(&mut vec![
            Operation::new("ET", vec![]),
            Operation::new("Q", vec![]),
            Operation::new("EMC", vec![]),
        ]);

        // Set the new content to the original stream and compress it
        if let Ok(encoded_content) = content.encode() {
            stream.set_plain_content(encoded_content);
            let _ = stream.compress();
        }

        Ok(())
    }

    fn clear_field_appearance(&mut self, oid: ObjectId) -> Result<(), LoadError> {
        let child_refs = {
            let object = self
                .document
                .objects
                .get_mut(&oid)
                .ok_or(LoadError::NoSuchReference(oid))?;
            let dict = object.as_dict_mut()?;
            dict.remove(b"AP");

            if let Ok(&Object::Array(ref kids)) = dict.get(b"Kids") {
                kids.iter()
                    .filter_map(|kid| match kid {
                        Object::Reference(id) => Some(*id),
                        _ => None,
                    })
                    .collect::<Vec<_>>()
            } else {
                Vec::new()
            }
        };

        for kid in child_refs {
            self.clear_field_appearance(kid)?;
        }

        Ok(())
    }

    /// If the field at index `n` is a checkbox field, toggles the check box based on the value
    /// `is_checked`.
    /// If it is not a checkbox field, returns ValueError
    ///
    /// # Panics
    /// Will panic if n is larger than the number of fields
    pub fn set_check_box(&mut self, n: usize, is_checked: bool) -> Result<(), ValueError> {
        match self.get_state(n) {
            FieldState::CheckBox { .. } => {
                let field = self
                    .document
                    .objects
                    .get_mut(&self.form_ids[n])
                    .unwrap()
                    .as_dict_mut()
                    .unwrap();

                let on = get_on_value(field);
                let state = Object::Name(
                    if is_checked { on.as_str() } else { "Off" }
                        .to_owned()
                        .into_bytes(),
                );

                field.set("V", state.clone());
                field.set("AS", state);

                Ok(())
            }
            _ => Err(ValueError::TypeMismatch),
        }
    }

    /// If the field at index `n` is a radio field, toggles the radio button based on the value
    /// `choice`
    /// If it is not a radio button field or the choice is not a valid option, returns ValueError
    ///
    /// # Panics
    /// Will panic if n is larger than the number of fields
    pub fn set_radio(&mut self, n: usize, choice: String) -> Result<(), ValueError> {
        match self.get_state(n) {
            FieldState::Radio { options, .. } => {
                if options.contains(&choice) {
                    let field = self
                        .document
                        .objects
                        .get_mut(&self.form_ids[n])
                        .unwrap()
                        .as_dict_mut()
                        .unwrap();
                    field.set("V", Object::Name(choice.into_bytes()));
                    Ok(())
                } else {
                    Err(ValueError::InvalidSelection)
                }
            }
            _ => Err(ValueError::TypeMismatch),
        }
    }

    /// If the field at index `n` is a listbox field, selects the options in `choice`
    /// If it is not a listbox field or one of the choices is not a valid option, or if too many choices are selected, returns ValueError
    ///
    /// # Panics
    /// Will panic if n is larger than the number of fields
    pub fn set_list_box(&mut self, n: usize, choices: Vec<String>) -> Result<(), ValueError> {
        match self.get_state(n) {
            FieldState::ListBox {
                options,
                multiselect,
                ..
            } => {
                if choices.iter().fold(true, |a, h| options.contains(h) && a) {
                    if !multiselect && choices.len() > 1 {
                        Err(ValueError::TooManySelected)
                    } else {
                        let field = self
                            .document
                            .objects
                            .get_mut(&self.form_ids[n])
                            .unwrap()
                            .as_dict_mut()
                            .unwrap();
                        match choices.len() {
                            0 => field.set("V", Object::Null),
                            1 => {
                                let encoded = encode_pdf_string(&choices[0]);
                                field.set("V", Object::String(encoded, StringFormat::Literal));
                            }
                            _ => {
                                let values = choices
                                    .iter()
                                    .map(|value| {
                                        Object::String(
                                            encode_pdf_string(value),
                                            StringFormat::Literal,
                                        )
                                    })
                                    .collect();
                                field.set("V", Object::Array(values));
                            }
                        };
                        Ok(())
                    }
                } else {
                    Err(ValueError::InvalidSelection)
                }
            }
            _ => Err(ValueError::TypeMismatch),
        }
    }

    /// If the field at index `n` is a combobox field, selects the options in `choice`
    /// If it is not a combobox field or one of the choices is not a valid option, or if too many choices are selected, returns ValueError
    ///
    /// # Panics
    /// Will panic if n is larger than the number of fields
    pub fn set_combo_box(&mut self, n: usize, choice: String) -> Result<(), ValueError> {
        match self.get_state(n) {
            FieldState::ComboBox {
                options, editable, ..
            } => {
                if options.contains(&choice) || editable {
                    let field = self
                        .document
                        .objects
                        .get_mut(&self.form_ids[n])
                        .unwrap()
                        .as_dict_mut()
                        .unwrap();
                    let encoded = encode_pdf_string(&choice);
                    field.set("V", Object::String(encoded, StringFormat::Literal));
                    Ok(())
                } else {
                    Err(ValueError::InvalidSelection)
                }
            }
            _ => Err(ValueError::TypeMismatch),
        }
    }

    /// Removes the field at index `n`
    ///
    /// # Panics
    /// Will panic if n is larger than the number of fields
    pub fn remove_field(&mut self, n: usize) -> Result<(), ValueError> {
        self.document
            .remove_object(&self.get_object_id(n))
            .map_err(|_| ValueError::NotFound)
    }

    /// Saves the form to the specified path
    pub fn save<P: AsRef<Path>>(&mut self, path: P) -> Result<(), io::Error> {
        self.document.save(path).map(|_| ())
    }

    /// Saves the form to the specified path
    pub fn save_to<W: Write>(&mut self, target: &mut W) -> Result<(), io::Error> {
        self.document.save_to(target)
    }

    fn get_possibilities(&self, oid: ObjectId) -> Vec<String> {
        let mut res = Vec::new();
        let kids_obj = self
            .document
            .objects
            .get(&oid)
            .unwrap()
            .as_dict()
            .unwrap()
            .get(b"Kids");
        if let Ok(&Object::Array(ref kids)) = kids_obj {
            for (i, kid) in kids.iter().enumerate() {
                let mut found = false;
                if let Ok(&Object::Dictionary(ref appearance_states)) = kid
                    .deref(&self.document)
                    .unwrap()
                    .as_dict()
                    .unwrap()
                    .get(b"AP")
                {
                    if let Ok(&Object::Dictionary(ref normal_appearance)) =
                        appearance_states.get(b"N")
                    {
                        for (key, _) in normal_appearance {
                            if key != b"Off" {
                                res.push(from_utf8(key).unwrap_or("").to_owned());
                                found = true;
                                break;
                            }
                        }
                    }
                }

                if !found {
                    res.push(i.to_string());
                }
            }
        }

        res
    }

    /// Sets the NeedAppearances flag on the AcroForm so PDF viewers regenerate field appearances.
    pub fn set_need_appearances(&mut self, value: bool) -> Result<(), LoadError> {
        let acroform_ref = self
            .document
            .trailer
            .get(b"Root")?
            .deref(&self.document)?
            .as_dict()?
            .get(b"AcroForm")?
            .as_reference()?;

        let acroform = self
            .document
            .objects
            .get_mut(&acroform_ref)
            .ok_or(LoadError::NoSuchReference(acroform_ref))?
            .as_dict_mut()?;

        acroform.set("NeedAppearances", Object::Boolean(value));
        Ok(())
    }
}
