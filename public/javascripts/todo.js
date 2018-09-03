$(function() {
  let mainTemplate = $('#main_template').html();
  let mainScript = Handlebars.compile(mainTemplate);

  // REFACTOR
  // register all partials via loop and collect via `data-type=partial`
  let allTodosTemplate = $('#all_todos_template').html();
  let allTodosScript = Handlebars.compile(allTodosTemplate);
  Handlebars.registerPartial('all_todos_template', allTodosScript);

  let titleTemplate = $('#title_template').html();
  let titleScript = Handlebars.compile(titleTemplate);
  Handlebars.registerPartial('title_template', titleScript);

  let listTemplate = $('#list_template').html();
  let listScript = Handlebars.compile(listTemplate);
  Handlebars.registerPartial('list_template', listScript);

  let itemPartialTemplate = $('#item_partial').html();
  let itemPartialScript = Handlebars.compile(itemPartialTemplate);
  Handlebars.registerPartial('item_partial', itemPartialScript);

  let allListTemplate = $('#all_list_template').html();
  let allListScript = Handlebars.compile(allListTemplate);
  Handlebars.registerPartial('all_list_template', allListScript);

  let completedTodosTemplate = $('#completed_todos_template').html();
  let completedTodosScript = Handlebars.compile(completedTodosTemplate);
  Handlebars.registerPartial('completed_todos_template', completedTodosScript);

  let completedListTemplate = $('#completed_list_template').html();
  let completedListScript = Handlebars.compile(completedListTemplate);
  Handlebars.registerPartial('completed_list_template', completedListScript);



  let localList = {
    todos: [],
    selectionTerm: '',

    templateContext: function() {
      // REFACTOR: group by date can take arg (done|todos) if
      // find proper context
      return {
        todos: this.todos,
        selected: this.selectTodos(this.selectionTerm),
        done: this.getDoneTodos(),
        todos_by_date: this.groupTodosByDate(this.todos),
        done_todos_by_date: this.groupTodosByDate(this.getDoneTodos()),
        current_section: {
          title: 'All Todos',
          data: this.todos.length,
        },
      };
    },

    deleteLocalTodo: function(id) {
      this.todos = this.todos.filter(function(todo) {
        return todo.id !== Number(id);
      });
    },

    /* need if decide to keep local changes w/o getting full list
    updateLocalTodo: function(id) {

    },
*/
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

    selectTodos: function(criteria) {
      // placeholder
      // with listeners on sidebar for any dl click, check closest section id
      // if it is 'all', get closest value for `data-title` and use to access to
      // todos or todos_by_date
      // if it is `completed`, get closest value for `data-title` and use access done of done_by_date
      return this.moveCompleteToEnd(this.todos);
    },

    groupTodosByDate: function(todos) {
      let todosByDate = {};

      todos.sort(function(a, b) {
        let date1 = a.due_date.split('/').reverse().join('');
        let date2 = b.due_date.split('/').reverse().join('');

        return (Number(date1) || 0) - (Number(date2) || 0);
      });

      todos.forEach(function(todo) {
        if (todosByDate[todo.due_date]) {
          todosByDate[todo.due_date].push(todo);
        } else {
          todosByDate[todo.due_date] = [todo];
        }
      });

      return todosByDate;
    },

    getDoneTodos: function() {
      return this.todos.filter(function(todo) {
        return todo.completed === true;
      });
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

  }; // end of localList


  const ui = {
    duration: 500,

    drawMain: function() {
      $('body').html(mainScript(localList.templateContext()));
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
          console.log(localList.todos);
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
          // no need to get whole list? if not, save return (with added 'due_date') to local list
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
        },
      });
    },
  };



  let sampleTodo = {
    "title": "Hello",
    "month": "01",
    "day": "11",
    "year": "2017",
    "description": "do stuff all day",
    "completed": "false",
  };


  let sampleUpdate = {
    "title": "Hello",
    "month": "01",
    "day": "11",
    "year": "2017",
    "description": "do stuff in morning",
    "due_date": "No Due Date",
    "completed": "false",
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

    // REFACTOR: extract to list method?
    if (jsonTodoData["title"].replace(/\W/g, '').length < 3) {
      alert("You must enter a title at least 3 characters long.");
    } else {
      if (id) {
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

  $('body').on('click', '.list_item > label', function(e) {
    e.preventDefault();

    let itemId = $(this).closest('tr').attr('data-id');

    ui.showPreFilledModal(itemId);
  });





}); // end of jQuery DOMLoaded wrapper

