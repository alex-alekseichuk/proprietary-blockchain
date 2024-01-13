
Processes Optimization. Interaction Automation. Micro Values. Direct Connections. Controlled Transparency. Paperless & Secure.

================== World State ==================

It is representation of a contract memory, built using chain of transactions.

The main idea, that each node has the same World State at the moment, because they all built it using same chain of transactions.

Each transaction which sent (created) by function, consist a commands, how to change some part of contract memory in current World State.

And all this cryptography, consensus rules, etc - it is protection from change the World State.

It can be any other database for the World State, selected according to the requirements.

We can build World State using RethinkdDB transactions history.

Example output of mongo-client, an it is the current World State:

> db.worldState.find({})
{ "contractId" : "ef165a802c224364f25b5a73ffc18a937cc29dd4707b8a597765e1578c2e5def",
  "memory" : {
    "bank" : {
      "Ad1PMd2Qu1bDtzcWFve1ozeCBxJoZbaY98p75engnBdR" : 1850,
      "zdHHBoae3JJu1bDtGNlFve1ozeCBxJoZbaY98p75engnBdR" : 150
}}}
{ "contractId" : "02db451934b09afbed7e3c9db1255d4dd337bed6123263e58636e2142d2ce597",
  "memory" : {
    "bank" : {
      "Ad1PMd2Qu1bDtzcWFve1ozeCBxJoZbaY98p75engnBdR" : 2000
}}}

><><><

There should be the "events system", ability to subscribe to changes in a contract memory.
There should be an ability to emit some events from function. But in this version it is not implemented.

Smart Contract - it is a combination of 2 main things:
- the same memory on each node, the same World State, and ability to get memory locally.
- Events System - reaction to the execution of a contract. Send some event to external system, if some event inside contract was triggered.

There are 2 type of transactions (both are CREATE type):

1) Creating a contract.

I removed some fields below, look at the "payload" section, it consists source code of contract and initial state of memory:

{
  "assignee": "FeQkNNnsVGJK9P1FuWBcfjP1jR596EfWRHifHUfDGF2L",
  "id": "df46810d8dba72abbe94844447148c4a33eb12981079d0532c1ef9b4f636f223",
  "transaction": {
    "data": {
      "payload": {
        "memory": {
          "bank": {
            "Ad1PMd2Qu1bDtzcWFve1ozeCBxJoZbaY98p75engnBdR": 2000
          }
        },
        "source": "module.exports = function(env, memory) {\n\n  this.init = function(amount)\n  {\n    bank[env.caller] = amount;\n  }\n\n  this.send = function(to, amount)\n  {\n    amount = parseInt(amount);\n\n    var bank = memory.bank; // []\n\n    if (!bank[env.
caller])\n    {\n      return false;\n    }\n\n    if (!bank[to]){\n      bank[to] = 0;\n    }\n\n    bank[env.caller] -= amount;\n\n    bank[to] += amount;\n\n    memory.bank = bank;\n\n    return { memory : memory };\n  }\n\n  this.get_balance = function(address)\n
{\n    var bank = memory.bank; // []\n\n    return bank[address];\n  }\n\n}\n"
      },
      "uuid": "a8d01604-f79b-4f6c-a772-04f46271ca89"
    },
    "operation": "CREATE",
  }
}


2) Change a memory of a contract.

It is another type of a  transaction, it consists:

- changedContractId : address of changing contract
- functionName : name of calling function
- args : argument for call function
- newMemory : in current version it change whole memory, but it should be simple commands.
Also in this version it can call one contract one time per block, because there is the issue if send a lot of call functions per one block, in what order to process them.

{
  "assignee": "FeQkNNnsVGJK9P1FuWBcfjP1jR596EfWRHifHUfDGF2L",
  "id": "43e985eb838b1a3b47187b6ca6604c4239bb63e1dfbf3ad60659d3e135a0d9cf",
  "transaction": {
    "data": {
      "payload": {
        "args": "zdHHBoae3JJu1bDtGNlFve1ozeCBxJoZbaY98p75engnBdR,150",
        "changedContractId": "df46810d8dba72abbe94844447148c4a33eb12981079d0532c1ef9b4f636f223",
        "functionName": "send",
        "newMemory": {
          "bank": {
            "Ad1PMd2Qu1bDtzcWFve1ozeCBxJoZbaY98p75engnBdR": 1850,
            "zdHHBoae3JJu1bDtGNlFve1ozeCBxJoZbaY98p75engnBdR": 150
          }
        }
      },
      "uuid": "5bc70c20-9517-44bb-9bc2-8c94d47c69bd"
    },
    "operation": "CREATE",
  }
}



