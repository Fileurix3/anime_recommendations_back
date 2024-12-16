import { UsersModel } from "../build/models/users_model.js";
import { expect } from "chai";
import request from "supertest";
import app from "../build/index.js";

describe("auth test", () => {
  let token;

  it("if password is less than 6 characters", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "testUser", password: "12345", email: "test@gmail.com" });

    expect(res.status).to.equal(400);

    expect(res.body).to.have.property("message", "Password must be at least 6 characters long");
  });

  it("if invalid email", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "testUser", password: "testUser", email: "testUser123" });

    expect(res.status).to.equal(400);

    expect(res.body).to.have.property("message", "Invalid email");
  });

  it("should create a new user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "testUser", password: "testUser", email: "test@gmail.com" });

    expect(res.status).to.equal(201);

    expect(res.body).to.have.property("message", "User successfully registered");
    expect(res.body).to.have.property("token").that.is.a("string");
  });

  it("if name already exists", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "testUser", password: "testUser", email: "test1@gmail.com" });

    expect(res.status).to.equal(400);

    expect(res.body).to.have.property("message", "User with this name or email already exists");
  });

  it("if email already exists", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "testUser1", password: "testUser", email: "test@gmail.com" });

    expect(res.status).to.equal(400);

    expect(res.body).to.have.property("message", "User with this name or email already exists");
  });

  it("login user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@gmail.com", password: "testUser" });

    token = res.body.token;

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property("token").that.is.a("string");
    expect(res.body).to.have.property("message", "Login successful");
  });

  it("if user has entered incorrect email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test1@gmail.com", password: "testUser" });

    expect(res.status).to.equal(400);

    expect(res.body).to.have.property("message", "Invalid email or password");
  });

  it("if user has entered incorrect password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@gmail.com", password: "userTest" });

    expect(res.status).to.equal(400);

    expect(res.body).to.have.property("message", "Invalid email or password");
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
