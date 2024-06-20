import { executeQuery } from "../db/executeQuery.js";

export function Registrant() {
  this.lastCheckTime = new Date();
  this.createdDate = new Date();
  this.checkedIn = false;
  this.age = undefined;
  this.id = undefined;
  this.firstName = "";
  this.lastName = "";
  this.gender = -1;

  // get all the registrants
  this.getAllRegistrants = async function () {
    try {
      const { results } = await executeQuery(
        `SELECT id, first_name, last_name, checked_in, age
        FROM registrant
        ORDER BY first_name ASC`,
        [this.id]
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

      return [];
    } catch (error) {
      console.error(error);
    }
  };

  // maps the request body to the registrant object
  this.newRegistrantFromRequestBody = function (body) {
    this.firstName = body.first_name;
    this.checkedIn = body.checked_in;
    this.lastName = body.last_name;
    this.checkIn = false;
    this.age = body.age;
  };

  // saves the registrant to the database
  this.save = async function () {
    try {
      const { results } = await executeQuery(
        `INSERT INTO registrant (first_name, last_name, checked_in, gender, age)
      VALUES (?, ?, ?, ?, ?)`,
        [this.firstName, this.lastName, this.checkIn, this.gender, this.age]
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
