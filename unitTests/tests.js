const chai = require("chai");
const expect = chai.expect;
const { readDataFile, writeDataFile } = require("./testFileUtils");
const fs = require("fs");
const path = require("path");

describe("Utility Functions Unit Tests", () => {
  const testFilePath = path.join(__dirname, "testData.json");
  const sampleData = {
    users: [
      {
        id: 1,
        email: "super@admin.com",
        username: "super",
        password: "123",
        role: "Super Admin",
        groups: ["admin-chat", "testing-channel", "createme"],
      },
      {
        id: 2,
        username: "shadingus",
        email: "shadingus@email.com",
        password: "password1",
        role: "Group Admin",
        groups: ["admin-chat", "testing-channel"],
      },
      {
        id: 4,
        username: "shid",
        email: "shid@wow.com",
        password: "poop",
        role: "User",
        groups: [],
      },
    ],
    groups: [
      {
        id: "admin-chat",
        name: "Admin Chat",
        channels: [],
        members: [1, 2],
        creatorId: 1,
      },
      {
        id: "testing-channel",
        name: "testing channel",
        channels: [],
        members: [1, 2],
        creatorId: 1,
      },
    ],
  };

  beforeEach(() => {
    // Create a sample file before each test
    fs.writeFileSync(testFilePath, JSON.stringify(sampleData));
  });

  afterEach(() => {
    // Clean up after each test
    fs.unlinkSync(testFilePath);
  });

  it("should read data from a file correctly", async () => {
    const data = await readDataFile(testFilePath);
    expect(data).to.deep.equal(sampleData);
  });

  it("should write data to a file correctly", async () => {
    const newData = { users: [{ id: 1, name: "Test User" }], groups: [] };
    await writeDataFile(testFilePath, newData);
    const updatedData = JSON.parse(fs.readFileSync(testFilePath));
    expect(updatedData).to.deep.equal(newData);
  });
});