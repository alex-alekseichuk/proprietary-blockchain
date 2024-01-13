Unit test coverage to 95 % 
add more integration tests
Smoke test for manifest.json
add congis to config file or get from configservice ex:ports, host IP

Integration tests:
drop()
Sync with empty Mongo
Sync with Mongo
Reset Db, Create DB, Drop Db, check DB

Transaction validation tests:
1. Tx has valid operation ok [x]
2. Same tx produces same hash [x]
3. Different tx produces different hash [x]
4. CREATE tx with existing tx id is valid [x]
5. CREATE tx with already used tx is invalid [x]
6. TRANSFER tx with existing tx id is invalid  [x]
7. Check that tx input.owners_before equals outputs.public_keys (from db) [x]
8. Check if tx.input is unspent [x]
9. Check if input.amount is equal to sum of outputs.amounts [x]
10. Check double spent (spent the same output twice) [x]
11. Check id assetType is the same for all inputs and outputs of the tx [x]