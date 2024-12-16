import { UsersModel } from "../build/models/users_model.js";
import { UserFavoriteModel } from "../build/models/user_favorite_model.js";
import { expect } from "chai";
import request from "supertest";
import app from "../build/index.js";

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

  it("get user profile", async () => {
    const res = await request(app).get("/user/profile/testUser");

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property("user");
    expect(res.body.user).to.have.property("id").that.is.a("string");
    expect(res.body.user).to.have.property("name").that.is.a("string");
    expect(res.body.user).to.have.property("createdAt").that.is.a("string");
    expect(res.body.user).to.have.property("updatedAt").that.is.a("string");

    expect(res.body).to.have.property("favorites").that.is.an("array");
  });

  after(async () => {
    await UsersModel.destroy({
      where: {
        name: "testUser",
      },
    });

    await UserFavoriteModel.destroy({
      where: {
        userId: userId,
      },
    });
  });
});
