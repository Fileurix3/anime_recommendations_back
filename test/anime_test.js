import { UsersModel } from "../build/models/users_model.js";
import { expect } from "chai";
import request from "supertest";
import app from "../build/index.js";
import { AnimeModel } from "../build/models/anime_model.js";
import { Op } from "@sequelize/core";
import minioClient from "../build/database/minio.js";

describe("anime test", () => {
  let userToken;
  let userId;

  before(async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "testUser", password: "testUser", email: "test@gmail.com" });

    userToken = res.body.token;
    userId = res.body.user.id;
  });

  it("search anime", async () => {
    const res = await request(app).get("/anime/search/sousou%20no%20frieren");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("result");

    expect(res.body.result[0]).to.have.property("id");
    expect(res.body.result[0]).to.have.property("imageUrl");
    expect(res.body.result[0]).to.have.property("title");
    expect(res.body.result[0]).to.have.property("titleEng");
    expect(res.body.result[0]).to.have.property("synopsis");
    expect(res.body.result[0]).to.have.property("episodes");
    expect(res.body.result[0]).to.have.property("aired");
    expect(res.body.result[0]).to.have.property("rating");
    expect(res.body.result[0]).to.have.property("genres");
  });

  it("get anime by id", async () => {
    const res = await request(app).get("/anime/get/1");

    expect(res.status).to.equal(200);

    expect(res.body.anime).to.have.property("id");
    expect(res.body.anime).to.have.property("imageUrl");
    expect(res.body.anime).to.have.property("title");
    expect(res.body.anime).to.have.property("titleEng");
    expect(res.body.anime).to.have.property("synopsis");
    expect(res.body.anime).to.have.property("episodes");
    expect(res.body.anime).to.have.property("aired");
    expect(res.body.anime).to.have.property("rating");
    expect(res.body.anime).to.have.property("genres");
  });

  it("if the user doesn't have a cookie", async () => {
    const res = await request(app).post("/anime/add/new").send({});

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property("message", "Unauthorized");
  });

  it("if the user doesn't have admin rights", async () => {
    const res = await request(app)
      .post("/anime/add/new")
      .send({})
      .set("Cookie", `token=${userToken}`);

    expect(res.status).to.equal(403);
    expect(res.body).to.have.property("message", "You don't have enough rights");

    await UsersModel.update({ adminRights: true }, { where: { id: userId } });
  });

  let animeId;

  it("add new anime", async () => {
    const res = await request(app)
      .post("/anime/add/new")
      .send({
        imageUrl: "https://avatars.githubusercontent.com/u/145297541?v=4",
        title: "testTitle",
        titleEng: "textEngTitle",
        synopsis: "testSynopsis",
        episodes: 24,
        aired: 2024,
        rating: "PG-13",
        genres: ["test", "123"],
      })
      .set("Cookie", `token=${userToken}`);

    animeId = res.body.anime.id;

    expect(res.status).to.equal(201);

    expect(res.body).to.have.property("message", "New anime successfully added");

    expect(res.body.anime).to.have.property("id");
    expect(res.body.anime).to.have.property("imageUrl");
    expect(res.body.anime).to.have.property("title");
    expect(res.body.anime).to.have.property("titleEng");
    expect(res.body.anime).to.have.property("synopsis");
    expect(res.body.anime).to.have.property("episodes");
    expect(res.body.anime).to.have.property("aired");
    expect(res.body.anime).to.have.property("rating");
    expect(res.body.anime).to.have.property("genres");
  });

  it("edit anime", async () => {
    const res = await request(app)
      .put(`/anime/edit/${animeId}`)
      .send({
        newEpisodes: 52,
      })
      .set("Cookie", `token=${userToken}`);

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property("message", "Anime updated successfully");

    const anime = await AnimeModel.findOne({
      where: {
        id: animeId,
      },
    });

    expect(anime.episodes).to.equal(52);
  });

  it("delete anime", async () => {
    const res = await request(app)
      .delete(`/anime/delete/${animeId}`)
      .set("Cookie", `token=${userToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("message", "Anime successfully delete");

    const anime = await AnimeModel.findOne({
      where: {
        id: animeId,
      },
    });

    expect(anime).to.be.null;
  });

  after(async () => {
    await UsersModel.destroy({
      where: {
        name: "testUser",
      },
    });

    await AnimeModel.destroy({
      where: {
        [Op.or]: [{ id: animeId }, { title: "testTitle" }],
      },
    });

    await minioClient.removeObject("images", "testTitle.png");
  });
});
