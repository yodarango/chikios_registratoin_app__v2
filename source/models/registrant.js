import { executeQuery } from "../db/executeQuery.js";

export function Registrant() {
  this.lastCheckTime = new Date();
  this.createdDate = new Date();
  this.profilePicture = "";
  this.checkIn = false;
  this.age = undefined;
  this.id = undefined;
  this.firstName = "";
  this.lastName = "";
  this.gender = -1;

  // get all the registrants
  this.getAllRegistrants = async function () {
    const { results } = await executeQuery("SELECT * FROM registrant", []);
    return results;
  };

  this.setLastCheckTime = function (lastCheckTime) {
    this.lastCheckTime = lastCheckTime;
  };

  return this;
}
