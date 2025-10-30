# Testing Guide for UI Redesign

## Quick Start
Run the application with:
```bash
cargo tauri dev --no-watch
```

## Test Checklist

### 1. Homepage (index.html)
- [ ] Page loads correctly
- [ ] MINT-EC logo displays properly
- [ ] "Handbuch" button works
- [ ] "Start" button navigates to student list
- [ ] Responsive on different screen sizes
- [ ] Buttons have hover effects

### 2. Navigation
- [ ] Hamburger menu opens sidebar
- [ ] Close button closes sidebar
- [ ] All navigation links work
- [ ] Hover effects show on menu items
- [ ] Sidebar animation is smooth
- [ ] Student search box in header works

### 3. Student List (schuelerbearbeiten.html)
- [ ] Table displays student data
- [ ] "Neuen Schüler hinzufügen" opens popup
- [ ] Edit button is disabled when no student selected
- [ ] Delete button is disabled when no student selected
- [ ] Selecting a student enables edit/delete buttons
- [ ] Table scrolls properly with many students
- [ ] "Weiter" button navigates to next page
- [ ] Hover effects on table rows

### 4. Academic Competence (fachliche-kompetenz.html)
- [ ] Form is disabled when no student selected
- [ ] Selecting a student enables the form
- [ ] Grade inputs accept values 1-15
- [ ] Subject name inputs work
- [ ] Average calculation updates
- [ ] Overall average displays
- [ ] Level (Stufe) displays correctly
- [ ] "Zurück" button works
- [ ] "Weiter" button works
- [ ] Statistics cards display properly

### 5. Scientific Work (fachwissenschaftliches-arbeiten.html)
- [ ] Form is disabled when no student selected
- [ ] Work type dropdown has all options
- [ ] Theme input works
- [ ] Description textarea works
- [ ] Grade input accepts values
- [ ] "Speichern" button saves data
- [ ] Navigation buttons work
- [ ] Icons display in labels

### 6. Additional MINT Activities (zusaetzlich.html)
- [ ] Activities table displays
- [ ] Levels table shows
- [ ] Completed activities table works
- [ ] SEK II toggle works
- [ ] Search bar toggle works
- [ ] "Aktivität hinzufügen" opens popup
- [ ] "Aktivität bearbeiten" works
- [ ] "Aktivität löschen" works
- [ ] Tables scroll properly
- [ ] Disabled states work correctly

### 7. Export Page (export.html)
- [ ] Page displays correctly
- [ ] PDF icon shows
- [ ] "PDF generieren" button is disabled without student
- [ ] Button enables with student selected
- [ ] Future features list displays
- [ ] "Zurück" button works

### 8. Settings Page (settings.html)
- [ ] All input fields work
- [ ] Folder picker button works
- [ ] School name input saves
- [ ] School location input saves
- [ ] Output path input saves
- [ ] Signer fields work (left and right)
- [ ] Form sections are clearly organized

### 9. Popups/Modals
#### Student Creation Popup
- [ ] Opens from header "Schüler erstellen" button
- [ ] All fields work (Vorname, Nachname, Abijahrgang, Geburtsdatum)
- [ ] "Fertig" button saves and closes
- [ ] "Speichern & Neuer Schüler" saves and resets form
- [ ] "Abbrechen" closes without saving
- [ ] Icons display in labels

#### Student Edit Popup
- [ ] Opens from student list edit button
- [ ] Pre-fills with student data
- [ ] All fields editable
- [ ] Save updates student
- [ ] Cancel doesn't save

#### Competition Popup
- [ ] Opens from "Aktivität hinzufügen" button
- [ ] Name field works
- [ ] All three level fields work
- [ ] Sekundarstufe checkboxes work
- [ ] "Fertig" saves and closes
- [ ] "Speichern & Neuer Wettbewerb" saves and resets

#### Competition Edit Popup
- [ ] Opens from "Aktivität bearbeiten" button
- [ ] Pre-fills with competition data
- [ ] All fields editable
- [ ] Save updates competition
- [ ] Cancel doesn't save

### 10. Responsive Design Tests
#### Mobile (720p / 1280x720)
- [ ] All pages display without horizontal scroll
- [ ] Buttons are easily clickable
- [ ] Forms are usable
- [ ] Tables scroll properly
- [ ] Navigation sidebar works
- [ ] Text is readable

#### Desktop (1080p / 1920x1080)
- [ ] Optimal layout and spacing
- [ ] All features accessible
- [ ] Good use of screen space

#### 4K (3840x2160)
- [ ] Text is not too small
- [ ] Elements scale appropriately
- [ ] Proper use of larger screen space
- [ ] No excessive white space

### 11. Disabled States
- [ ] Forms disabled when no student selected
- [ ] Buttons disabled appropriately
- [ ] Disabled elements have visual indication (gray, opacity)
- [ ] Cursor shows "not-allowed" on disabled items
- [ ] Disabled states prevent interaction

### 12. Visual Design
- [ ] Color scheme is consistent
- [ ] Buttons have proper hover effects
- [ ] Transitions are smooth (not jarring)
- [ ] Shadows add depth appropriately
- [ ] Typography is clear and readable
- [ ] Spacing feels comfortable
- [ ] Icons enhance understanding

### 13. Performance
- [ ] Pages load quickly
- [ ] No lag when typing in inputs
- [ ] Smooth scrolling
- [ ] Animations don't cause slowdown
- [ ] No flickering or visual glitches

### 14. Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on macOS)

## Known Issues to Check
1. Ensure student search suggestions appear correctly
2. Verify competition search shows/hides properly with toggle
3. Check that all Material Icons load
4. Confirm grade color coding works
5. Verify all data persists when navigating between pages

## Report Format
When reporting issues, please include:
1. Which page/component
2. What action was taken
3. Expected result
4. Actual result
5. Screen size being tested
6. Browser and version

## Success Criteria
✅ All interactive elements work as before the redesign
✅ Visual design is consistent across all pages
✅ Responsive on all target screen sizes
✅ No functionality regression
✅ Improved user experience with better visual hierarchy
