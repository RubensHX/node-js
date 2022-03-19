const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistCPF(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    res.status(400).json({ error: "Customer not found" });
  }

  req.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.value;
    } else {
      return acc - operation.value;
    }
  }, 0);
  return balance;
}

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return res.status(400).json({ error: "Customer already exists" });
  }

  const id = uuidv4();

  customers.push({ id, cpf, name, statement: [] });

  return res.status(201).send();
});

app.get("/statement", verifyIfExistCPF, (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
});

app.post("/deposit", verifyIfExistCPF, (req, res) => {
  const { description, amount } = req.body;
  const { customer } = req;
  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "credit",
  };
  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.post("/withdraw", verifyIfExistCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;
  const balance = getBalance(customer.statement);
  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient funds" });
  }
  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: "debit",
  };
  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.get("/statement/date", verifyIfExistCPF, (req, res) => {
    const { customer } = req;
    const { date } = req.query;
    
    const dateFormat =  new Date(date + " 00:00");

    const statement = customer.statement.filter(
        (statement) => statement.createdAt.toDateString() === new Date((dateFormat).toDateString())
    );

    return res.json(statement);
  });

app.put("/account", verifyIfExistCPF, (req, res) => {
    const { name } = req.body;
    const { customer } = req;

    customers.name = name;

    return res.status(201).send();
})

app.get("/account", verifyIfExistCPF, (req, res) => {
    const { customer } = req;

    return res.json(customer);  
})

app.delete("/account", verifyIfExistCPF, (req, res) => {
    const { customer } = req;

    customers.splice(customer, 1)

    return res.status(204).json(customer)
})

app.get("/balance", verifyIfExistCPF, (req, res) => {
    const { customer } = req;
    const balance = getBalance(customer.statement);

    return res.json(balance)

})

app.listen(3333);
