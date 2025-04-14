
  // Datenstruktur für die Wettbewerbe und Stufen
  let wettbewerbeData = [
    { id: 1, name: "Mathematik Olympiade" },
    { id: 2, name: "Informatik Wettbewerb" },
    { id: 3, name: "Chemie Wettbewerb" },
    { id: 3, name: "Chemie Wettbewerb" },
    { id: 3, name: "Chemie Wettbewerb" }
  ];

  let stufenData = {
    1: [
      { stufe: 1, beschreibung: "Runde 1" },
      { stufe: 2, beschreibung: "Runde 2" },
      { stufe: 3, beschreibung: "Finale" }
    ],
    2: [
      { stufe: 1, beschreibung: "Code Challenge 1" },
      { stufe: 2, beschreibung: "Code Challenge 2" },
      { stufe: 3, beschreibung: "Code Challenge 3" }
    ],
    3: [
      { stufe: 1, beschreibung: "Praktische Übung 1" },
      { stufe: 2, beschreibung: "Praktische Übung 2" },
      { stufe: 3, beschreibung: "Finale Experiment" }
    ],
    4: [
      { stufe: 1, beschreibung: "Praktische Übung 1" },
      { stufe: 2, beschreibung: "Praktische Übung 2" },
      { stufe: 3, beschreibung: "Finale Experiment" }
    ],
    5: [
      { stufe: 1, beschreibung: "Praktische Übung 1" },
      { stufe: 2, beschreibung: "Praktische Übung 2" },
      { stufe: 3, beschreibung: "Finale Experiment" }
    ]
  };

  let erreichteWettbewerbe = [
    { id: 1, name: "Mathematik Olympiade", stufe: 2 },
    { id: 2, name: "Informatik Wettbewerb", stufe: 3 }
  ];

  // Funktion zum Befüllen der Wettbewerbstabelle
  function populateWettbewerbeTable() {
    const wettbewerbeTable = document.getElementById('wettbewerbe-table').getElementsByTagName('tbody')[0];
    wettbewerbeTable.innerHTML = ''; // Tabelle zurücksetzen

    wettbewerbeData.forEach((wettbewerb) => {
      const row = wettbewerbeTable.insertRow();
      row.insertCell(0).textContent = wettbewerb.id;
      const nameCell = row.insertCell(1);
      nameCell.textContent = wettbewerb.name;

      // Doppelklick-Event zum Bearbeiten der Wettbewerbsnamen
      nameCell.addEventListener('dblclick', () => {
        if (row.classList.contains('active-row')) {
          const newName = prompt("Wettbewerbsnamen bearbeiten:", wettbewerb.name);
          if (newName) {
            wettbewerb.name = newName;
            nameCell.textContent = newName;
            updateErreichteWettbewerbeTable(); // Erreichte Wettbewerbe auch aktualisieren
          }
        }
      });

      row.addEventListener('click', () => {
        // Alle Zeilen zurücksetzen
        const rows = wettbewerbeTable.getElementsByTagName('tr');
        for (let r of rows) {
          r.classList.remove('active-row');
        }

        // Die angeklickte Zeile hervorheben
        row.classList.add('active-row');

        // Tabelle 2 basierend auf dem ausgewählten Wettbewerb anpassen
        updateStufenTable(stufenData[wettbewerb.id]);
      });
    });

    // Das erste Element automatisch auswählen
    const firstRow = wettbewerbeTable.querySelector('tr');
    if (firstRow) {
      firstRow.classList.add('active-row');
      updateStufenTable(stufenData[wettbewerbeData[0].id]);
    }

    // Erreichte Wettbewerbe ebenfalls aktualisieren
    updateErreichteWettbewerbeTable();
  }

  // Funktion zum Befüllen der Stufentabelle
  function updateStufenTable(stufen) {
    const stufenTable = document.getElementById('stufen-table').getElementsByTagName('tbody')[0];
    stufenTable.innerHTML = ''; // Zuerst alle Zeilen löschen

    stufen.forEach((stufe) => {
      const row = stufenTable.insertRow();
      const stufeCell = row.insertCell(0);
      stufeCell.textContent = stufe.stufe;
      const beschreibungCell = row.insertCell(1);
      beschreibungCell.textContent = stufe.beschreibung;

      // Doppelklick-Event zum Bearbeiten der Stufenbeschreibungen
      beschreibungCell.addEventListener('dblclick', () => {
        const newBeschreibung = prompt("Stufenbeschreibung bearbeiten:", stufe.beschreibung);
        if (newBeschreibung) {
          stufe.beschreibung = newBeschreibung;
          beschreibungCell.textContent = newBeschreibung;
          updateErreichteWettbewerbeTable(); // Erreichte Wettbewerbe auch aktualisieren
        }
      });

      row.classList.add('clickable');
      row.addEventListener('click', () => {
        // Den Wettbewerb und die Stufe zu Tabelle 3 hinzufügen
        addToErreichteWettbewerbe(row, stufe);
      });
    });
  }

  // Funktion zum Hinzufügen des Wettbewerbs und der Stufen zu Tabelle 3
  function addToErreichteWettbewerbe(row, stufe) {
    const wettbewerbeTable = document.getElementById('wettbewerbe-table').getElementsByTagName('tbody')[0];
    const activeRow = wettbewerbeTable.querySelector('.active-row');
    const wettbewerbName = activeRow.cells[1].textContent;

    const erreichteWettbewerbeTable = document.getElementById('erreichte-wettbewerbe-table').getElementsByTagName('tbody')[0];
    const newRow = erreichteWettbewerbeTable.insertRow();
    newRow.insertCell(0).textContent = wettbewerbName;
    newRow.insertCell(1).textContent = `${stufe.stufe}: ${stufe.beschreibung}`;

    // Löschen-Button hinzufügen
    const deleteCell = newRow.insertCell(2);
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Löschen';
    deleteButton.classList.add('delete-btn'); // Anwendung des neuen Stils
    deleteButton.addEventListener('click', (e) => {
      const confirmation = confirm('Möchten Sie diesen Eintrag wirklich löschen?');
      if (confirmation) {
        newRow.remove();
        updateErreichteWettbewerbeTable(); // Erreichte Wettbewerbe nach dem Löschen aktualisieren
      }
      e.stopPropagation(); // Verhindert das Auslösen des Zeilenklicks
    });
    deleteCell.appendChild(deleteButton);
  }

  // Funktion zur dynamischen Aktualisierung der erreichten Wettbewerbe Tabelle
  function updateErreichteWettbewerbeTable() {
    const erreichteWettbewerbeTable = document.getElementById('erreichte-wettbewerbe-table').getElementsByTagName('tbody')[0];
    erreichteWettbewerbeTable.innerHTML = ''; // Alle Zeilen zurücksetzen

    erreichteWettbewerbe.forEach((eintrag) => {
      const row = erreichteWettbewerbeTable.insertRow();
      row.insertCell(0).textContent = eintrag.name;
      row.insertCell(1).textContent = `${eintrag.stufe}: ${stufenData[eintrag.id][eintrag.stufe - 1].beschreibung}`;

      // Löschen-Button hinzufügen
      const deleteCell = row.insertCell(2);
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Löschen';
      deleteButton.classList.add('delete-btn'); // Anwendung des neuen Stils
      deleteButton.addEventListener('click', (e) => {
        const confirmation = confirm('Möchten Sie diesen Eintrag wirklich löschen?');
        if (confirmation) {
          row.remove();
          // Erreichte Wettbewerbe Array ebenfalls aktualisieren
          erreichteWettbewerbe = erreichteWettbewerbe.filter(e => e !== eintrag);
        }
        e.stopPropagation(); // Verhindert das Auslösen des Zeilenklicks
      });
      deleteCell.appendChild(deleteButton);
    });
  }

  // Funktion zum Hinzufügen eines neuen Wettbewerbs
  function showAddWettbewerbForm() {
    const name = prompt("Geben Sie den Namen des neuen Wettbewerbs ein:");
    if (name) {
      const newId = wettbewerbeData.length + 1;

      // Stufeninformationen abfragen
      let stufen = [];
      for (let i = 1; i <= 3; i++) {
        const beschreibung = prompt(`Geben Sie die Beschreibung für Stufe ${i} ein:`);
        stufen.push({ stufe: i, beschreibung: beschreibung });
      }

      // Den neuen Wettbewerb und die Stufen speichern
      wettbewerbeData.push({ id: newId, name: name });
      stufenData[newId] = stufen;

      populateWettbewerbeTable();
    }
  }

  // Tabellen befüllen, wenn die Seite geladen wird
  window.onload = populateWettbewerbeTable;

  // Hole das Checkbox-Element und den Text
  const toggleSwitch = document.getElementById('toggleSwitch');
  const sekText = document.getElementById('sekText');
  
  // Füge einen Event-Listener hinzu, der reagiert, wenn der Schalter umgelegt wird
  toggleSwitch.addEventListener('change', function() {
    if (toggleSwitch.checked) {
      sekText.textContent = 'SEK II'; // Ändere den Text, wenn der Schalter aktiviert ist
    } else {
      sekText.textContent = 'SEK I'; // Setze den Text zurück, wenn der Schalter deaktiviert ist
    }
  });
  const toggleSwitchTable = document.getElementById('toggleSwitchTable');
  const myTable = document.getElementById('wettbewerbe-table');
  const mySearch = document.getElementById('wettbewerbsSuche');

  toggleSwitchTable.addEventListener('change', function() {
    if (toggleSwitchTable.checked) {
        myTable.style.display = 'none'; // Verstecke die Tabelle
        mySearch.style.display = "block";
    } else {
      
      myTable.style.display = 'table'; // Zeige die Tabelle
      mySearch.style.display = "none";
    }
  });