const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const startDbAndServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () => {
    console.log("server running");
  });
};
startDbAndServer();

const districtDetailsResponse = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

const displayStateData = (dbObjData) => {
  return {
    stateId: dbObjData.state_id,
    stateName: dbObjData.state_name,
    population: dbObjData.population,
  };
};

//get states list
app.get("/states/", async (request, response) => {
  const statesListQuery = `
    SELECT * FROM state
    ;`;
  const stateArr = await db.all(statesListQuery);
  response.send(stateArr.map((eachState) => displayStateData(eachState)));
});
//get a state detail
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getAStateQuery = `
    SELECT state_id AS stateId,state_name AS stateName, population FROM state
    WHERE state_id=${stateId}
    ;`;
  const stateDetails = await db.get(getAStateQuery);
  response.send(stateDetails);
});
//post district details in districts table
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictDetails = `
  INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
  VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths})
  ;`;
  await db.run(addDistrictDetails);
  response.send("District Successfully Added");
});
//get a district
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getADistrictQuery = `
    SELECT 
    district_id AS districtId,
    district_name AS districtName,
    state_id AS stateId,
    cases,
    cured,
    active,
    deaths
    
    FROM district
    WHERE district_id=${districtId}
    ;`;
  const districtDetails = await db.get(getADistrictQuery);
  response.send(districtDetails);
});
// delete district
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteADistrictQuery = `
    DELETE FROM district
    WHERE district_id=${districtId}
    ;`;
  await db.get(deleteADistrictQuery);
  response.send("District Removed");
});
//put method districts details based on id
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateADistrictQuery = `
    UPDATE district
    SET
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE district_id=${districtId}
    ;`;
  await db.get(updateADistrictQuery);
  response.send("District Details Updated");
});
// get total statistics of state
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totalCasesQuery = `SELECT
  sum(cases) as totalCases,sum(cured) AS totalCured,sum(active) AS totalActive,sum(deaths) AS totalDeaths
  FROM district
  WHERE state_id=${stateId}

  ;`;
  total = await db.get(totalCasesQuery);
  response.send(total);
});
//get state by district
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT state_name as stateName
    FROM state join district
    WHERE district_id=${districtId}
    ;`;
  const stateName = await db.get(getStateNameQuery);
  response.send(stateName);
});
module.exports = app;
