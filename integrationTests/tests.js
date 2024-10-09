// Import necessary modules
const http = require("http"); // To make HTTP requests
const chai = require("chai"); // Chai assertion library for testing
const expect = chai.expect; // Expect syntax from Chai for assertions
const express = require("express"); // Express framework to set up the server
const path = require("path"); // Path module for working with file and directory paths
const { readDataFile, writeDataFile } = require("./testFileUtils"); // Custom utility functions to read/write test data
const testGroupRoutes = require("./testGroups"); // Import test-specific group routes

describe("Group Routes Integration Tests", () => {
  let server; // Variable to store the Express server instance
  let app; // Variable to store the Express app instance
  const testDataPath = path.join(__dirname, "./testData.json"); // Path to the test data file
  const sampleData = { users: [{ id: 1, groups: [] }], groups: [] }; // Initial sample data for the tests

  // Set up Express app and test data before running the tests
  before((done) => {
    // Write the initial test data using the utility function
    writeDataFile(testDataPath, sampleData)
      .then(() => {
        // Initialize the Express app
        app = express();
        app.use(express.json()); // Middleware to parse incoming JSON requests

        // Middleware to inject the test data file path into the request object
        app.use((req, res, next) => {
          req.dataFilePath = testDataPath; // Use test data file path
          next();
        });

        // Use the test-specific group routes for this test
        app.use("/groups", testGroupRoutes);

        // Start the server on port 3000
        server = app.listen(3000, () => {
          console.log("Integration test server running on port 3000");
          done(); // Signal that the server is ready
        });
      })
      .catch(done); // Handle any errors during setup
  });

  // Close the server after all tests are complete
  after((done) => {
    server.close(done); // Close the server and signal the end of tests
  });

  // Test for the POST /groups/create route
  describe("POST /groups/create", () => {
    it("should create a new group and return 201", (done) => {
      // Define the POST request data (payload)
      const postData = JSON.stringify({
        id: 1,
        name: "Test Group",
        channels: [],
        members: [1],
        creatorId: 1,
      });
      // Define options for the HTTP request
      const options = {
        hostname: "localhost",
        port: 3000,
        path: "/groups/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      };
      // Make the HTTP request
      const req = http.request(options, (res) => {
        // Expect a 201 status code (Created)
        expect(res.statusCode).to.equal(201); 
        let data = "";
        // Collect response data as it comes in
        res.on("data", (chunk) => {
          data += chunk;
        });
        // On response end, parse the data and perform assertions
        res.on("end", () => {
          const responseBody = JSON.parse(data);
          // Assert that the response has the correct message and group name
          expect(responseBody).to.have.property(
            "message",
            "Group created successfully"
          );
          expect(responseBody.group).to.include({ name: "Test Group" });
          // Check if the group was actually added to the file
          readDataFile(testDataPath)
            .then((testData) => {
              // Ensure 1 group was added
              expect(testData.groups).to.have.lengthOf(1);
              // Check the group's name
              expect(testData.groups[0]).to.include({ name: "Test Group" }); 
              done();
            })
            .catch(done);
        });
      });
      // Handle request errors
      req.on("error", (error) => {
        console.error("Request error:", error);
        done(error); // Mark the test as failed if there's an error
      });
      // Write the POST data to the request body
      req.write(postData);
      // End the request
      req.end();
    });
  });

  // Test for the GET /groups/:groupId route
  describe("GET /groups/:groupId", () => {
    it("should return the group if the user has access", (done) => {
      // Updated test data to simulate a group being created
      const updatedData = {
        users: [{ id: 1, groups: [1] }],
        groups: [{ id: 1, name: "Test Group", members: [1] }],
      };
      // Write the updated test data using the utility function
      writeDataFile(testDataPath, updatedData)
        .then(() => {
          // URL-encode the user role (to handle spaces and special characters)
          const userRole = encodeURIComponent("Super Admin");
          // Define options for the GET request
          const options = {
            hostname: "localhost",
            port: 3000,
            path: `/groups/1?userId=1&userRole=${userRole}`,
            method: "GET",
            headers: { "Content-Type": "application/json" },
          };
          // Make the HTTP request
          const req = http.request(options, (res) => {
            // Expect a 200 status code (OK)
            expect(res.statusCode).to.equal(200);
            // Variable to store response data
            let data = ""; 
            // Collect response data as it comes in
            res.on("data", (chunk) => {
              data += chunk;
            });
            // On response end, parse the data and perform assertions
            res.on("end", () => {
              const responseBody = JSON.parse(data);
              // Assert that the group is returned with the correct name
              expect(responseBody).to.have.property("name", "Test Group");
              done();
            });
          });
          // Handle request errors
          req.on("error", (error) => {
            console.error("Request error:", error);
            done(error);
          });
          // End the request (no body required for GET)
          req.end();
        })
        .catch(done);
    });
  });
});