import { UsersModel } from "../build/models/users_model.js";
import { UserFavoriteModel } from "../build/models/user_favorite_model.js";
import { expect } from "chai";
import request from "supertest";
import app from "../build/index.js";
import { Op } from "@sequelize/core";

describe("users test", () => {
  let userToken;
  let userId;

  before(async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "testUser", password: "testUser", email: "test@gmail.com" });

    userToken = res.body.token;
    userId = res.body.user.id;
  });

  it("if the user doesn't have a cookie", async () => {
    const res = await request(app).post("/user/change/anime/favorites").send({
      animeId: 1,
    });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property("message", "Unauthorized");
  });

  it("add anime in favorite if anime not fount", async () => {
    const res = await request(app)
      .post("/user/change/anime/favorites")
      .send({
        animeId: "0",
      })
      .set("Cookie", `token=${userToken}`);

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property("message", "anime not found");
  });

  it("add anime in favorite", async () => {
    const res = await request(app)
      .post("/user/change/anime/favorites")
      .send({
        animeId: "1",
      })
      .set("Cookie", `token=${userToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property(
      "message",
      "The anime has been successfully added to favorites"
    );
  });

  it("delete anime from favorite", async () => {
    const res = await request(app)
      .post("/user/change/anime/favorites")
      .send({
        animeId: "1",
      })
      .set("Cookie", `token=${userToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property(
      "message",
      "The anime has been successfully deleted from favorites"
    );
  });

  it("get user profile by name", async () => {
    const res = await request(app).get("/user/profile/testUser");

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property("user");
    expect(res.body.user).to.have.property("id").that.is.a("string");
    expect(res.body.user).to.have.property("name").that.is.a("string");
    expect(res.body.user)
      .to.have.property("avatar")
      .that.satisfies((val) => val == null || typeof val == "string");
    expect(res.body.user).to.have.property("createdAt").that.is.a("string");
    expect(res.body.user).to.have.property("updatedAt").that.is.a("string");

    expect(res.body).to.have.property("favorites").that.is.an("array");
  });

  it("get your profile", async () => {
    const res = await request(app).get("/user/profile").set("Cookie", `token=${userToken}`);

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property("user");
    expect(res.body.user).to.have.property("id").that.is.a("string");
    expect(res.body.user).to.have.property("name").that.is.a("string");
    expect(res.body.user)
      .to.have.property("avatar")
      .that.satisfies((val) => val == null || typeof val == "string");
    expect(res.body.user).to.have.property("createdAt").that.is.a("string");
    expect(res.body.user).to.have.property("updatedAt").that.is.a("string");

    expect(res.body).to.have.property("favorites").that.is.an("array");
  });

  it("update name if this name already exists", async () => {
    const newUser = await UsersModel.create({
      name: "zxczxc",
      email: "zxc@gmail.com",
      password: "zxczxc",
    });

    const res = await request(app)
      .put("/user/update/profile")
      .set("Cookie", `token=${userToken}`)
      .send({ newName: "zxczxc" });

    expect(res.status).to.equal(400);

    expect(res.body).to.have.property("message", "This name already exists");

    await UsersModel.destroy({
      where: {
        id: newUser.id,
      },
    });
  });

  it("update profile", async () => {
    const res = await request(app)
      .put("/user/update/profile")
      .set("Cookie", `token=${userToken}`)
      .send({ newName: "zxczxc" });

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property("message", "User profile was successfully update");

    const updateUser = await UsersModel.findOne({
      where: {
        id: userId,
      },
    });

    const newUserName = updateUser.name;

    expect(newUserName).to.equal("zxczxc");
  });

  it("change password if old password is invalid", async () => {
    const res = await request(app)
      .put("/user/change/password")
      .set("Cookie", `token=${userToken}`)
      .send({ oldPassword: "wrongPassword", newPassword: "testUser" });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("message", "The old password is incorrect");
  });

  it("change password if new password = old password", async () => {
    const res = await request(app)
      .put("/user/change/password")
      .set("Cookie", `token=${userToken}`)
      .send({ oldPassword: "testUser", newPassword: "testUser" });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property(
      "message",
      "The old password must not match the new one password"
    );
  });

  it("change password", async () => {
    const res = await request(app)
      .put("/user/change/password")
      .set("Cookie", `token=${userToken}`)
      .send({ oldPassword: "testUser", newPassword: "testUser123" });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("message", "Password was successfully update");
  });

  after(async () => {
    await UsersModel.destroy({
      where: {
        [Op.and]: {
          id: userId,
          name: "testUser",
          name: "zxczxc",
        },
      },
    });

    await UserFavoriteModel.destroy({
      where: {
        userId: userId,
      },
    });
  });
});
