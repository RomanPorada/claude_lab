import axiosClient from "./axiosClient";

export function createOrder(order) {
  return axiosClient.post("/orders", order).then((res) => res.data);
}

export function fetchMyOrders() {
  return axiosClient.get("/orders").then((res) => res.data);
}
