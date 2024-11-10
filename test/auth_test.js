import { UsersModel } from "../build/models/users_model.js";
import { expect } from "chai";
import request from "supertest";
import app from "../build/index.js";

describe("auth test", () => {
  let token;

  it("if password is less than 6 characters", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "testUser", password: "12345" });

    expect(res.status).to.equal(400);

    expect(res.body).to.have.property("message", "Password must be at least 6 characters long");
  });

  it("should create a new user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "testUser", password: "testUser" });

    expect(res.status).to.equal(201);

    expect(res.body).to.have.property("message", "User successfully registered");
    expect(res.body).to.have.property("token").that.is.a("string");
  });

  it("if user already exists", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "testUser", password: "testUser" });

    expect(res.status).to.equal(400);

    expect(res.body).to.have.property("message", "User with this name already exists");
  });

  it("login user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ name: "testUser", password: "testUser" });

    token = res.body.token;

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property("token").that.is.a("string");
    expect(res.body).to.have.property("message", "Login successful");
  });

  it("if user has entered incorrect name", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ name: "userTest", password: "testUser" });

    expect(res.status).to.equal(400);

    expect(res.body).to.have.property("message", "Invalid name or password");
  });

  it("if user has entered incorrect password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ name: "testUser", password: "userTest" });

    expect(res.status).to.equal(400);

    expect(res.body).to.have.property("message", "Invalid name or password");
  });

  it("logout user", async () => {
    const res = await request(app).get("/auth/logout").set("Cookie", `token=${token}`);

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property("message", "logout successfully");
  });

  after(async () => {
    await UsersModel.destroy({
      where: {
        name: "testUser",
      },
    });
  });
});
