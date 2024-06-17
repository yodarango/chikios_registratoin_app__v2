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
    // const { results } = await executeQuery("SELECT * FROM registrant", []);
    // return results;

    return [
      { id: 1, firstName: "John", lastName: "Doe", gender: 1 },
      { id: 2, firstName: "Jane", lastName: "Une", gender: 2 },
      { id: 3, firstName: "Jim", lastName: "three", gender: 1 },
      { id: 4, firstName: "Jill", lastName: "thims", gende: 2 },
    ];
  };

  this.setLastCheckTime = function (lastCheckTime) {
    this.lastCheckTime = lastCheckTime;
  };

  return this;
}
