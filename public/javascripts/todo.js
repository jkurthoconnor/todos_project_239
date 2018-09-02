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

    selected: [],

    templateContext: function() {
      return {
        todos: this.todos,
        selected: this.selectTodos(),
      };
    },

    makeLocalTodos: function(json) {
      json.forEach(function(todo, idx, arr) {
        if (Number(todo.month) && Number(todo.year)) {
          arr[idx]["due_date"] = `${todo.month}/${todo.year}`;
        } else {
          arr[idx]["due_date"] = 'No Due Date';
        }
      });

      this.todos = json;
    },

    selectTodos: function(criteria) {
      // placeholder
      return this.todos;
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
    duration: 600,

    showModal: function() {
      $('.modal').fadeIn(this.duration);
    },

    hideModal: function() {
      $('.modal').fadeOut(this.duration);
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
          $('body').html(mainScript(localList.templateContext()));
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
          console.log(api.getList());
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
          console.log(json);
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

    if (jsonTodoData["title"].replace(/\W/g, '').length < 3) {
      alert("You must enter a title at least 3 characters long.");
    } else {
      api.saveNewTodo(jsonTodoData);
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






}); // end of jQuery DOMLoaded wrapper

