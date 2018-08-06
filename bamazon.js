var mysql = require('mysql');
var inquirer = require("inquirer");
const cTable = require('console.table');



var con = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    socketPath: "/Applications/MAMP/tmp/mysql/mysql.sock",
    database: "bamazon"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected as id: " +con.threadId);
  start(); 
});
  
 
  

  var start = function(){
    inquirer.prompt({
        name: "mode",
        type: "list",
        message: "Would you like to sign in as Customer, Manager or Supervisor?",
        choices: ['Customer', 'Manager', 'Supervisor']
    }).then(function(answer){
        switch(answer.mode){
          case "Customer":
          showInventory(customerMode);
          
          break;
          case "Manager":
          managerChoice();
          break;
          case "Supervisor":
          console.log("This mode is comming soon");
          break;
        }
    })
 }

function showInventory(callback){
  console.log("this works");
      con.query("SELECT * FROM products", function (err, result, rows) {
          if (err) throw err;
          console.table(result);
          callback(result); 
      });   

    
}

 var customerMode = function(result){
  inquirer
    .prompt([
      {
        name: "ChoosenID",
        type: "input",
        message: "Please type the ID of the product you would like to buy",
        validate: function(value){
          if(isNaN(value) == false && parseInt(value) <= result.length && parseInt(value) > 0){
            return true;
          } else{
            return false;
          }
        }
      }, {
        name: "ChoosenQuantity",
        type: "input",
        message: "Please type how many units of the product you would like to buy",
        validate: function(value){
          if(isNaN(value)){
            return false;
          } else{
            return true;
          }
        }
      }
    ])
    .then(function(answer) {
      var itemId = answer.ChoosenID - 1;
      var qty = parseInt(answer.ChoosenQuantity);
      
      if (result[itemId].stock_quantity< qty) {
        console.log("Insufficient quantity!");
        customerQuit();
      } else {
        var total = parseFloat(((result[itemId].price)*qty).toFixed(2));
        con.query("UPDATE products SET ? WHERE ?", [
          {stock_quantity: (result[itemId].stock_quantity - qty)},
          {item_id: answer.ChoosenID}
          ], function(err, res){
              if(err) throw err;
              console.log("Thank you! Your total is $" + total);
              customerQuit();
          });
      }
      
    });
 }

 function customerQuit(){
  inquirer.prompt([{
    type: "confirm",
    name: "customerQuit",
    message: "Would you like to buy enything else?"
  }]).then(function(ans){
    if(ans.customerQuit){
      showInventory(customerMode);
      
    } else{
      console.log("Have a great day!");
      con.end();
    }
  });
}

var managerChoice = function(){
  inquirer.prompt({
      name: "mode",
      type: "list",
      message: "What would you like to do?",
      choices: ['View Products for Sale', 'View Low Inventory', 'Add to Inventory', 'Add New Product']
  }).then(function(answer){
      switch(answer.mode){
        case "View Products for Sale":
        managerView();
        break;

        case "View Low Inventory":
        viewLowInventory();
        break;

        case "Add to Inventory":
        showInventory(addToInventory);
        break;

        case "Add New Product":
        addNewproduct();
        break;
      }
  })
}

var managerView = function() {
  con.query("SELECT * FROM products", function (err, result, rows) {
    if (err) throw err;
    console.table(result); 
    managerQuit();
  });   
}

var viewLowInventory = function() {
  con.query("SELECT * FROM products WHERE stock_quantity < 5", function (err, result, rows) {
    if (err) throw err;
    console.table(result);
    managerQuit();
  });   
}

var addToInventory = function(result) {

  inquirer
    .prompt([
      {
        name: "addedID",
        type: "input",
        message: "Please type the ID of the product you would like to add",
        validate: function(value){
          if(isNaN(value)){
            return false;
          } else{
            return true;
          }
        }
      }, {
        name: "quantity",
        type: "input",
        message: "Please type how many units of the product you would like to add",
        validate: function(value){
          if(isNaN(value)){
            return false;
          } else{
            return true;
          }
        }
      }
    ])
    .then(function(answer) {
      var itemIdToAdd = answer.addedID - 1;
      var quantityToAdd = parseInt(answer.quantity);
      console.table(result);
      
      con.query("UPDATE products SET ? WHERE ?", [
            {stock_quantity: (result[itemIdToAdd].stock_quantity + quantityToAdd)},
            {item_id: answer.addedID}
            ], function(err, res){
                if(err) throw err;
                console.log("Thank you! Your sucsessfully added " + quantityToAdd + " items to " + result[itemIdToAdd].product_name);
                managerQuit();
      });
    
      
    }); 
}

function addNewproduct() {
  inquirer.prompt([{
    type: "input",
    name: "newId",
    message: "Please type unique ID for the new product.",
    validate: function(value){
      if(isNaN(value)){
        return false;
      } else{
        return true;
      }
    }
  }, {
    type: "input",
    name: "newName",
    message: "Please type the name of new product."
  }, {
    type: "input",
    name: "depName",
    message: "Please type the department name of new product."
  }, {
    type: "input",
    name: "newPrice",
    message: "Please type the price of new product.",
    validate: function(value){
      if(isNaN(value)){
        return false;
      } else{
        return true;
      }
    }
  }, {
    type: "input",
    name: "newQuantity",
    message: "Please type the quantity of new product in stock.",
    validate: function(value){
      if(isNaN(value)){
        return false;
      } else{
        return true;
      }
    }
  }]).then(function(answer){
    con.query(
      "INSERT INTO products SET ?",
      {
        item_id: answer.newId,
        product_name: answer.newName,
        department_name: answer.depName,
        price: answer.newPrice,
        stock_quantity: answer.newQuantity
      },
      function(err, res) {
        if(err) throw err;
        console.log("You successfully added new product!")
        managerQuit();
      }
    );
  });
}

function managerQuit(){
  inquirer.prompt([{
    type: "confirm",
    name: "customerQuit",
    message: "Would you like to do enything else?"
  }]).then(function(ans){
    if(ans.customerQuit){
      managerChoice();
      
    } else{
      console.log("Have a great day!");
      con.end();
    }
  });
}