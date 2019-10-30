const todoApp = require('../../pages/app');

module.exports = {
  onCreate() {
    this.state = {
      isEditing: false,
      editingTitle: ''
    };
  },

  saveEdit() {
    if (this.state.isEditing) {
      var newTitle = this.getEl('titleInput').value;
      todoApp.updateTodo(this.input.id, { title: newTitle });
      this.state.isEditing = false;
    }
  },

  cancelEdit() {
    this.state.isEditing = false;
  },

  handleCheckboxChange(event, input) {
    var completed = input.checked === true;
    todoApp.setTodoCompleted(this.input.id, completed);
  },

  handleLabelDblClick() {
    this.state.isEditing = true;
    this.state.editingTitle = this.input.title;
  },

  removeTodo() {
    todoApp.removeTodo(this.input.id);
  },

  onUpdate() {
    if (this.state.isEditing) {
      var inputEl = this.getEl('titleInput');
      inputEl.focus();
      var val = inputEl.value;
      inputEl.value = '';
      inputEl.value = val;
    }
  },

  handleInputKeyDown(event) {
    if (event.keyCode === 13 /* ENTER */) {
      this.saveEdit();
    } else if (event.keyCode === 27 /* ESC */) {
      this.cancelEdit();
    }
  }
};
