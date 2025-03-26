class Note {
  constructor(id, title, text, archived = false) {
    this.id = id;
    this.title = title;
    this.text = text;
    this.archived = archived;
  }
}

class App {
  constructor() {
    this.notes = JSON.parse(localStorage.getItem("notes")) || [];
    this.selectedNoteId = "";
    this.showArchived = false;

    // Form elements
    this.$activeForm = document.querySelector(".active-form");
    this.$inactiveForm = document.querySelector(".inactive-form");
    this.$noteTitle = document.querySelector("#note-title");
    this.$noteText = document.querySelector("#note-text");
    this.$notes = document.querySelector(".notes");
    this.$form = document.querySelector("#form");

    // Modal elements
    this.$modal = document.querySelector(".modal");
    this.$modalForm = document.querySelector("#modal-form");
    this.$modalTitle = document.querySelector("#modal-title");
    this.$modalText = document.querySelector("#modal-text");
    this.$closeModalForm = document.querySelector("#modal-btn");

    // Sidebar elements
    this.$sidebar = document.querySelector(".sidebar");
    this.$sidebarItems = document.querySelectorAll(".sidebar-item");

    this.addEventListeners();
    this.displayNotes();
  }

  addEventListeners() {
    document.body.addEventListener("click", (event) => {
      // Prevent event bubbling for archive icon clicks
      if (event.target.closest(".tooltip.archive")) {
        this.handleArchiveIconClick(event);
        event.stopPropagation();
        return;
      }

      this.handleFormClick(event);
      this.closeModal(event);
      this.openModal(event);
    });

    this.$form.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = this.$noteTitle.value.trim();
      const text = this.$noteText.value.trim();
      if (text || title) {
        this.addNote({ title, text });
        this.closeActiveForm();
      }
    });

    this.$modalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (this.selectedNoteId) {
        this.editNote(this.selectedNoteId, {
          title: this.$modalTitle.value.trim(),
          text: this.$modalText.value.trim(),
        });
        this.$modal.classList.remove("open-modal");
      }
    });

    this.$sidebar.addEventListener("mouseover", () => {
      this.$sidebar.classList.add("sidebar-hover");
      this.$sidebar.style.width = "280px";
      document.querySelectorAll(".sidebar-text").forEach((text) => {
        text.style.display = "block";
      });
    });

    this.$sidebar.addEventListener("mouseout", () => {
      this.$sidebar.classList.remove("sidebar-hover");
      this.$sidebar.style.width = "80px";
      document.querySelectorAll(".sidebar-text").forEach((text) => {
        text.style.display = "none";
      });
    });

    this.$sidebarItems.forEach((item) => {
      item.addEventListener("click", (event) => {
        this.handleSidebarClick(event);
      });
    });
  }

  handleFormClick(event) {
    const isActiveFormClickedOn =
      this.$activeForm && this.$activeForm.contains(event.target);
    const isInactiveFormClickedOn =
      this.$inactiveForm && this.$inactiveForm.contains(event.target);
    const title = this.$noteTitle ? this.$noteTitle.value : "";
    const text = this.$noteText ? this.$noteText.value : "";

    if (isInactiveFormClickedOn) {
      this.openActiveForm();
    } else if (
      !isInactiveFormClickedOn &&
      !isActiveFormClickedOn &&
      (title || text)
    ) {
      this.addNote({ title, text });
      this.closeActiveForm();
    }
  }

  openActiveForm() {
    if (this.$inactiveForm) this.$inactiveForm.style.display = "none";
    if (this.$activeForm) this.$activeForm.style.display = "block";
    if (this.$noteText) this.$noteText.focus();
  }

  closeActiveForm() {
    if (this.$inactiveForm) this.$inactiveForm.style.display = "block";
    if (this.$activeForm) this.$activeForm.style.display = "none";
    if (this.$noteText) this.$noteText.value = "";
    if (this.$noteTitle) this.$noteTitle.value = "";
  }

  handleArchiveIconClick(event) {
    const $selectedNote = event.target.closest(".note");
    if ($selectedNote) {
      const noteId = $selectedNote.id;
      this.toggleArchiveNoteById(noteId);

      // animation class
      $selectedNote.classList.add("note-archive-animation");
      setTimeout(() => {
        this.render();
      }, 300);
    }
  }

  toggleArchiveNoteById(noteId) {
    this.notes = this.notes.map((note) =>
      note.id === noteId ? { ...note, archived: !note.archived } : note
    );
    this.saveNotes();
  }

  handleSidebarClick(event) {
    const $clickedItem = event.target.closest(".sidebar-item");
    if ($clickedItem) {
      // Remove active class from all items
      this.$sidebarItems.forEach((item) => {
        item.classList.remove("active-item");
        item
          .querySelector(".material-symbols-outlined")
          .classList.remove("active");
      });

      // Add active class to clicked item
      $clickedItem.classList.add("active-item");
      $clickedItem
        .querySelector(".material-symbols-outlined")
        .classList.add("active");

      // Toggle archive view based on clicked item
      const iconText = $clickedItem
        .querySelector(".material-symbols-outlined")
        .textContent.trim();
      this.showArchived = iconText === "archive";
      this.render();
    }
  }

  openModal(event) {
    const $selectedNote = event.target.closest(".note");
    if ($selectedNote && !event.target.closest(".tooltip.archive")) {
      this.selectedNoteId = $selectedNote.id;
      const note = this.notes.find((note) => note.id === this.selectedNoteId);
      if (note) {
        this.$modalTitle.value = note.title;
        this.$modalText.value = note.text;
        this.$modal.classList.add("open-modal");
      }
    }
  }

  closeModal(event) {
    const isModalFormClickedOn = this.$modalForm.contains(event.target);
    const isCloseModalBtnClickedOn = this.$closeModalForm.contains(
      event.target
    );

    if (
      (!isModalFormClickedOn || isCloseModalBtnClickedOn) &&
      this.$modal.classList.contains("open-modal")
    ) {
      const title = this.$modalTitle.value.trim();
      const text = this.$modalText.value.trim();

      if (title || text) {
        this.editNote(this.selectedNoteId, { title, text });
      }
      this.$modal.classList.remove("open-modal");
    }
  }

  addNote({ title, text }) {
    if (text || title) {
      const newNote = new Note(this.generateId(), title, text);
      this.notes = [newNote, ...this.notes];
      this.saveNotes();
      this.render();
    }
  }

  editNote(id, { title, text }) {
    this.notes = this.notes.map((note) =>
      note.id === id ? { ...note, title, text } : note
    );
    this.saveNotes();
    this.render();
  }

  generateId() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }

  saveNotes() {
    localStorage.setItem("notes", JSON.stringify(this.notes));
  }

  render() {
    this.displayNotes();
  }

  displayNotes() {
    const notesToDisplay = this.notes.filter((note) =>
      this.showArchived ? note.archived : !note.archived
    );

    this.$notes.innerHTML = notesToDisplay
      .map(
        (note) => `
                <div class="note" id="${note.id}">
                    <span class="material-symbols-outlined check-circle">check_circle</span>
                    <div class="title">${note.title}</div>
                    <div class="text">${note.text}</div>
                    <div class="note-footer">
                        <div class="tooltip">
                            <span class="material-symbols-outlined hover small-icon">add_alert</span>
                            <span class="tooltip-text">Remind me</span>
                        </div>
                        <div class="tooltip">
                            <span class="material-symbols-outlined hover small-icon">person_add</span>
                            <span class="tooltip-text">Collaborator</span>
                        </div>
                        <div class="tooltip">
                            <span class="material-symbols-outlined hover small-icon">palette</span>
                            <span class="tooltip-text">Change Color</span>
                        </div>
                        <div class="tooltip">
                            <span class="material-symbols-outlined hover small-icon">image</span>
                            <span class="tooltip-text">Add Image</span>
                        </div>
                        <div class="tooltip archive">
                            <span class="material-symbols-outlined hover small-icon">
                                ${note.archived ? "unarchive" : "archive"}
                            </span>
                            <span class="tooltip-text">
                                ${note.archived ? "Unarchive" : "Archive"}
                            </span>
                        </div>
                        <div class="tooltip">
                            <span class="material-symbols-outlined hover small-icon">more_vert</span>
                            <span class="tooltip-text">More</span>
                        </div>
                    </div>
                </div>
            `
      )
      .join("");
  }
}

const app = new App();
