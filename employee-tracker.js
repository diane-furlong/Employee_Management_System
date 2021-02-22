const mysql = require('mysql')
const inquirer = require('inquirer')
const app = require('express')()
const cTable = require('console.table')
const Employee = require('./employees.js')
const { title } = require('process')

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: process.env.DB_PASS,
  database: 'employee_tracker_db',
})

const promptUser = () =>
    inquirer.prompt([
        {
            type: 'list',
            message: 'What would you like to do?',
            choices: ['View All Employees', 'View All Employees By Department', 'View All Employees By Manager', 'Add Employee', 'Remove Employee', 'Update Employee Role', 'Update Employee Manager', 'Exit'],
            name: 'initialPrompt'
        }
    ])
    .then (function (answer){
        switch(answer.initialPrompt){
            case 'View All Employees':
                viewAll()
                break
            case 'View All Employees By Department':
                viewByDept()
                break
            case 'View All Employees By Manager':
                viewByMgr()
                break
            case 'Add Employee':
                addEmployee()
                break
            // case 'Remove Employee':
            //     removeEmployee()
            //     break
            // case 'Update Employee Role':
            //     updateEmployeeRole()
            //     break
            case 'Exit':
                connection.end()
                break
        }
    })

const viewAll = () => {
    const query = 'SELECT e.id, e.first_name, e.last_name, role.title, department.name AS department, role.salary, concat(m.first_name, " ", m.last_name) AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id LEFT OUTER JOIN role ON e.role_id = role.id INNER JOIN department ON role.department_id = department.id'
    connection.query(query, (err, res) => {
        if (err) throw err
          console.table(res)
          promptUser()
    })
}

const viewByDept = () => {
    inquirer.prompt([
        {
            type: 'list',
            message: 'What department would you like to view?',
            choices: ['construction', 'marketing'],
            name: 'chooseDept'
        }
    ])
    .then (answer => {
        const query = 'SELECT employees.id, employees.first_name, employees.last_name, role.title, department.name FROM employees LEFT OUTER JOIN role ON employees.role_id = role.id INNER JOIN department ON role.department_id = department.id WHERE ?'
        connection.query(query,
        {name: answer.chooseDept},
        (err, res) => {
            if (err) throw err
            console.table(res)
            promptUser()
        })
    })
}

// const viewByMgr = () =>{
//     const managersArray = []

//     connection.query((err, res) => {
//         if (err) throw err
//         res.forEach((employees) => {
//             if(employees.id === employees.manager_id){
//             managersArray.push(employees.manager_id)
//             }
//         })
    

//         inquirer.prompt([
//             {
//                 type: 'list',
//                 message: "Which manager's reports would you like to see?",
//                 choices: [managersArray],
//                 name: 'chooseMgr'
//             }
//         ])
//     })

//     .then (answer => {
//     const query = 'SELECT e.id, e.first_name, e.last_name, role.title, department.name AS department, role.salary, concat(m.first_name, " ", m.last_name) AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id LEFT OUTER JOIN role ON e.role_id = role.id INNER JOIN department ON role.department_id = department.id WHERE ?'
//     connection.query(query,
//     {name: answer.chooseMgr},
//     (err, res) => {
//         if (err) throw err
//         console.table(res)
//         })
//     })
// }

const viewByMgr = () => {
    const query = 'SELECT e.id, e.first_name, e.last_name, role.title, department.name AS department, role.salary, concat(m.first_name, " ", m.last_name) AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id LEFT OUTER JOIN role ON e.role_id = role.id INNER JOIN department ON role.department_id = department.id ORDER BY manager'
    connection.query(query, (err, res) => {
        if (err) throw err
          console.table(res)
          promptUser()
    })
}

const addEmployee = () => {
    const titleArray = []
   
    const query = 'SELECT role.id, role.title FROM role'
    connection.query(query, (err, res) => {
        if (err) throw err
        for(i=0;i<res.length;i++){
            titleArray.push(res[i].title)
        }
        const managerArray = []
        const query2 = 'SELECT e.id, e.first_name, e.last_name, concat(m.first_name, " ", m.last_name) AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id'
        connection.query(query2, (err, res) => {
            if (err) throw err
            for(i=0;i<res.length;i++){
                if(res[i].manager !== null){
                   managerArray.push(res[i].manager) 
                }
            }

            //make option for employee to not have manager
            managerArray.unshift('--')

            inquirer.prompt([
                {
                    type: 'input',
                    message: "What is the new employee's first name?",
                    name: 'newFirstName',
                    validate: function(input){
                        if(input === ""){
                            console.log("First name is required.")
                            return false
                        }
                        else {
                            return true
                        }
                    }
                },
                {
                    type: 'input',
                    message: "What is the new employee's last name?",
                    name: 'newLastName',
                    validate: function(input){
                        if(input === ""){
                            console.log("Last name is required.")
                            return false
                        }
                        else {
                            return true
                        }
                    }
                },
                {
                    type: 'list',
                    message: "What is the new employee's title?",
                    choices: titleArray,
                    name: 'newEmpTitle'
                },
                {
                    type: 'list',
                    message: "Who is the new employee's manager?",
                    choices: managerArray,
                    name: 'newEmpMgr' 
                }
            ])  
            .then ((answer) => {
                console.log("worked")
                const query = 'SELECT role.id, role.title FROM role'
                connection.query(query, (err, role) => {
                    if (err) throw err
                    
                    //set variables for ID
                    let titleID = null
                  
                    //get the role ID of the new employee's title
                    for(i=0;i<role.length;i++){
                        if (answer.newEmpTitle == role[i].title){
                            titleID = role[i].id
                        }
                    }  
                    
                    const query2 = 'SELECT e.id, e.first_name, e.last_name, concat(m.first_name, " ", m.last_name) AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id'
                    connection.query(query2, (err, manager) => {
                        if (err) return err
                      
                        //set variable for ID
                        let managerID = null
                        let managerName = null
                        let managerNameArray = null
                        
                        //look in the database for the manager's name. match the name with the manager's employee.id
                        //if answer.newEmpMgr == manager, managerID = manager.id
                        for (i=0;i<1;i++){
                            if (manager[i] = answer.newEmpMgr){
                                console.log(manager[i])
                                managerName = manager[i]
                                managerNameArray = managerName.split(" ")
                            }
                        }
                        console.log(managerNameArray)
                        console.log(managerNameArray[0])
                    
                        const query3 = 'SELECT employees.id, employees.first_name, employees.last_name, employees.manager_id FROM employees'
                        connection.query(query3, (err, res) => {
                            if (err) return err
                            console.log(managerNameArray)
        
                            for(i=0;i<res.length;i++){
                                if (managerNameArray[0] === res[i].first_name){
                                    console.log("manager thing worked")
                                    console.log(res[i].first_name)
                                    if(managerNameArray[1] === res[i].last_name){
                                        console.log(res[i].last_name)
                                        console.log(res[i].id)
                                        managerID = res[i].id
                                    }
                                }
                            }
                            //add the employee to db
                            const query = 'INSERT INTO employees (first_name,last_name,role_id,manager_id) VALUES (?)'
                            const values =  [answer.newFirstName, answer.newLastName, titleID, managerID]
                            connection.query(query, [values], (err, res) => {
                                if (err) throw err
                                console.table("New employee added.")
                                promptUser()
                            })
                        })
                    })
                })
            })
        })
    })
}

const removeEmployee = () => {}

const updateEmployeeRole = () => {}

connection.connect((err) => {
    if (err) throw err
    promptUser()
})