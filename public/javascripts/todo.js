$(function() {
  let mainTemplate = $('#main_template').html();
  let mainScript = Handlebars.compile(mainTemplate);

  let $partials = $('[data-type="partial"]');

  $partials.each(function() {
    let template = $(this).html();
    let script = Handlebars.compile(template);
    let title = $(this).attr('id');

    Handlebars.registerPartial(title, script);
  });

  let localList = {
    todos: [],
    selectionTerms: 'all:All Todos',

    setContext: function() {
      return {
        todos: this.todos,
        done: this.setDoneTodos(),
        todos_by_date: this.setByDate(this.todos, 'todos'),
        done_todos_by_date: this.setByDate(this.done, 'done'),
        selected: this.setSelection(this.selectionTerms),
        current_section: this.currentSection,
      };
    },

    deleteLocalTodo: function(id) {
      this.todos = this.todos.filter(function(todo) {
        return todo.id !== Number(id);
      });
    },

    makeLocalTodos: function(json) {
      json.forEach(function(todo, idx, arr) {
        if (Number(todo.month) && Number(todo.year)) {
          arr[idx]["due_date"] = `${todo.month}/${todo.year.slice(2)}`;
        } else {
          arr[idx]["due_date"] = 'No Due Date';
        }
      });

      this.todos = json;
    },

    getTodoById: function(id) {
      return this.todos.filter(function(todo) {
        return Number(id) === todo.id;
      })[0];
    },

    setSelection: function(terms) {
      let data;
      let [category, list] = terms.split(':'); 
      
      if (category === 'all' && list === 'All Todos') {
        data = this.todos || [];
      } else if (category === 'completed_items' && list === 'Completed') {
        data = this.done || [];
      } else if (category === 'all') {
        data = this.todosByDate[list] || [];
      } else {
        data = this.doneTodosByDate[list] || [];
      }

      this.setCurrentSection(list, data.length);
      this.selection = this.moveCompleteToEnd(data);

      return this.selection;
    },

    setCurrentSection(sectionTitle, count) {
      this.currentSection = {
          title: sectionTitle,
          data: count,
      };
    },

    setByDate: function(todos, target) {
      let result = {};
      todos = todos.slice();

      todos.sort(function(a, b) {
        let date1 = a.due_date.split('/').reverse().join('');
        let date2 = b.due_date.split('/').reverse().join('');

        return (Number(date1) || 0) - (Number(date2) || 0);
      });

      todos.forEach(function(todo) {
        if (result[todo.due_date]) {
          result[todo.due_date].push(todo);
        } else {
          result[todo.due_date] = [todo];
        }
      });

      if (target === 'todos') {
        this.todosByDate = result;
      } else {
        this.doneTodosByDate = result;
      }

      return result;
    },

    setDoneTodos: function() {
      this.done = this.todos.filter(function(todo) {
        return todo.completed === true;
      });

      return this.done;
    },

    moveCompleteToEnd: function(selectedTodos) {
      let clone = selectedTodos.slice();

      return clone.sort(function(a, b) {
        return Number(a.completed) - Number(b.completed);
      });
    },

    prepFormData: function(serializedArr) {
      let jsonReady = {
        completed: 'false',
      };

      serializedArr.forEach(function(field) {
        jsonReady[field.name] = field.value;
      });

      return jsonReady;
    },
  };


  const ui = {
    duration: 500,

    drawMain: function() {
      $('body').html(mainScript(localList.setContext()));
    },

    showModal: function() {
      $('.modal').fadeIn(this.duration);
    },

    hideModal: function() {
      let $form = $('#form_modal > form');

      $('.modal').fadeOut(this.duration);
      $form.removeAttr('data-id');
      $form.get(0).reset();
    },

    showPreFilledModal: function(id) {
      let $fields = $('#form_modal').find('[name="title"], [name="day"], [name="month"], [name="year"], [name="description"]');
      let todo = localList.getTodoById(id);


      $('#form_modal > form').attr('data-id', id);

      $fields.each(function() {
        let key = $(this).attr('name');
        $(this).val(todo[key]);
      });

      this.showModal();
    },

  }; // end of ui

  const api = {  // id args can be passed as num or str
    getList: function() {
      $.ajax({
        url: `http://localhost:4567/api/todos`,
        type: 'GET',
        dataType: 'json',
        success: function(json) {
          localList.makeLocalTodos(json);
          ui.drawMain();
        },
      });
    },

    getTodo: function(id) {
      $.ajax({
        url: `http://localhost:4567/api/todos/${id}`,
        type: 'GET',
        dataType: 'json',
        success: function(json) {
          console.log(json);
        }
      });
    },

    saveNewTodo: function(jsonObj) {
      $.ajax({
        url: `http://localhost:4567/api/todos`,
        type: 'POST',
        data: jsonObj,
        dataType: 'json',
        success: function(json) {
          console.log(json);
          // no need to get whole list? if not, save return (with added 'due_date') to local list
          api.getList();
          ui.hideModal();
        },
      });
    },

    updateTodo: function(id, jsonObj) {
      $.ajax({
        url: `http://localhost:4567/api/todos/${id}`,
        type: 'PUT',
        data: jsonObj,
        dataType: 'json',
        success: function(json) {
          api.getList();
          ui.hideModal();
        },
      });
    },

    deleteTodo: function(id) {
      $.ajax({
        url: `http://localhost:4567/api/todos/${id}`,
        type: 'DELETE',
        statusCode: {
          204: function() {
          console.log('deleted');
          }
        },
        success: function() {
          localList.deleteLocalTodo(id);
          ui.drawMain();
        },
      });
    },

    toggleTodoCompletion: function(id) {
      $.ajax({
        url: `http://localhost:4567/api/todos/${id}/toggle_completed`,
        type: 'POST',
        success: function(json) {
          console.log(json);
          api.getList();
        },
      });
    },
  };


  api.getList();

  $('body').on('click', 'label[for="new_item"]', function(e) {
    ui.showModal();
  });


  $('body').on('submit', '#form_modal > form', function(e) {
    e.preventDefault();

    let todoData = $(this).serializeArray();
    let jsonTodoData = localList.prepFormData(todoData);
    let id = $('#form_modal > form').attr('data-id');

    if (jsonTodoData["title"].replace(/\W/g, '').length < 3) {
      alert("You must enter a title at least 3 characters long.");
    } else {
      if (id) {
        delete jsonTodoData.completed;
        api.updateTodo(id, jsonTodoData); 
      } else {
        api.saveNewTodo(jsonTodoData);
      }
    }
  });

  $('body').on('click', '#form_modal button[name="complete"]', function(e) {
    e.preventDefault();

    let id = $('#form_modal > form').attr('data-id');

    if (!id) {
      alert("You may not complete a new item.");
    } else {
      api.updateTodo(id, {"completed": "true"});
    }
  });

  $('body').on('click', '#modal_layer', function(e) {
    ui.hideModal();
  });

  $('body').on('click', 'td.delete', function(e) {
    e.preventDefault();

    let itemId = $(this).parent().attr('data-id');

    api.deleteTodo(itemId);
  });

  $('body').on('click', 'td.list_item', function(e) {
    e.preventDefault();

    let itemId = $(this).closest('tr').attr('data-id');

    if ($(e.target).is('label')) {
      ui.showPreFilledModal(itemId);
    } else {
      api.toggleTodoCompletion(itemId);
    }
  });


  $('body').on('click', '#sidebar dl', function(e) {
    e.preventDefault();

    let section = $(this).closest('section').attr('id');
    let title = $(this).closest('[data-title]').attr('data-title'); 
    
    localList.selectionTerms = `${section}:${title}`;

    console.log(localList.selectionTerms);

    ui.drawMain();

  });



}); // end of jQuery DOMLoaded wrapper


