import api from "./api";

export const mlService = {
  async registerFace(file) {
    const form = new FormData();
    form.append("face_image", file, file.name || "face.jpg");
    const res = await api.post("/ml/register-face", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async scan({ foodImage, faceImage }) {
    const form = new FormData();
    form.append("food_image", foodImage, foodImage.name || "food.jpg");
    form.append("face_image", faceImage, faceImage.name || "face.jpg");
    const res = await api.post("/ml/scan", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
    return res.data;
  },
};
