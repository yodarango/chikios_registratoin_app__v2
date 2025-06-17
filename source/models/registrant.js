import { executeQuery } from "../db/executeQuery.js";

export function Registrant() {
  this.lastCheckTime = new Date();
  this.createdDate = new Date();
  this.checkedIn = false;
  this.age = undefined;
  this.id = undefined;
  this.firstName = "";
  this.lastName = "";
  this.attendance = "";
  this.gender = -1;

  // TODO: update this since the attendance is hard coded
  // get all the registrants
  this.getAllRegistrants = async function () {
    try {
      const { results } = await executeQuery(
        `SELECT r.*, 
        g.first_name as guardian_first_name, 
        g.last_name as guardian_last_name, 
        g.id as guardian_id
        FROM registrant as r
        JOIN guardian as g
        ON r.id = g.registrant_id
        WHERE r.attendance LIKE '%2024%'
        ORDER BY first_name ASC`,
        []
      );

      return results;
    } catch (error) {
      console.error(error);
    }
  };

  // TODO: update this since the attendance is hard coded
  // get all the registrants
  this.getAllRegistrantsForLastConf = async function () {
    try {
      const { results } = await executeQuery(
        `SELECT r.*, 
        g.first_name as guardian_first_name, 
        g.last_name as guardian_last_name,
        g.phone_number as guardian_phone_number
        FROM registrant as r
        LEFT JOIN guardian as g
        ON r.id = g.registrant_id
        ORDER BY first_name ASC`,
        []
      );

      return results;
    } catch (error) {
      console.error(error);
    }
  };

  // get a single registrant by id
  this.getSingleRegistrantById = async function () {
    try {
      const { results } = await executeQuery(
        `SELECT r.*, 
      g.first_name as guardian_first_name, 
      g.last_name as guardian_last_name, 
      g.phone_number as guardian_phone_number
      FROM registrant as r
      JOIN guardian as g
      ON r.id = g.registrant_id
      WHERE r.id = ?`,
        [this.id]
      );

      if (results.length > 0) {
        return results[0];
      }

      return null;
    } catch (error) {
      console.error(error);
    }
  };

  // maps the request body to the registrant object
  this.newRegistrantFromRequestBody = function (body) {
    this.attendance = body.attendance;
    this.firstName = body.first_name;
    this.checkedIn = body.checked_in;
    this.lastName = body.last_name;
    this.gender = body.gender;
    this.checkIn = false;
    this.age = body.age;
    this.id = body.id;
  };

  // checks if the registrant exists
  this.checkIfRegistrantExists = async function () {
    try {
      const { results } = await executeQuery(
        `SELECT * FROM registrant WHERE id = ?`,
        [this.id]
      );

      return results.length > 0;
    } catch (error) {
      console.error(error);
    }
  };

  this.update = async function () {
    try {
      const { results } = await executeQuery(
        `UPDATE registrant 
        SET attendance = ?, first_name = ?, last_name = ? , gender = ? , age = ?
        WHERE ID = ? `,
        [
          this.attendance,
          this.firstName,
          this.lastName,
          this.gender,
          this.age,
          this.id,
        ]
      );

      const updatedRegistrantId = results?.insertId;

      return { updatedRegistrantId, success: results.affectedRows > 0 };
    } catch (error) {
      console.error(error);
    }
  };

  // saves the registrant to the database
  this.save = async function () {
    try {
      const { results } = await executeQuery(
        `INSERT INTO registrant (first_name, last_name, checked_in, gender, age, attendance)
      VALUES (?, ?, ?, ?, ?, ?)`,
        [
          this.firstName,
          this.lastName,
          this.checkIn,
          this.gender,
          this.age,
          this.attendance,
        ]
      );

      const newRegistrantId = results?.insertId;

      return { newRegistrantId, success: results.affectedRows > 0 };
    } catch (error) {
      console.error(error);
    }
  };

  this.checkIn = async function () {
    try {
      const { results } = await executeQuery(
        "UPDATE registrant SET checked_in = ? WHERE id = ?",
        [this.checkedIn, this.id]
      );

      return { success: results.affectedRows > 0 };
    } catch (error) {
      console.error(error);
    }
  };

  this.checkOut = async function () {
    try {
      const { results } = await executeQuery(
        "UPDATE registrant SET checked_in = ? WHERE id = ?",
        [this.checkedIn, this.id]
      );

      return { success: results.affectedRows > 0 };
    } catch (error) {
      console.error(error);
    }
  };

  this.deleteRegistrant = async function () {
    try {
      const { results } = await executeQuery(
        "DELETE FROM registrant WHERE id = ?",
        [this.id]
      );

      return { success: results.affectedRows > 0 };
    } catch (error) {
      console.error(error);
    }
  };

  return this;
}
