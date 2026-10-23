import axiosClient from "./axiosClient";

export function fetchAtoms(params = {}) {
  return axiosClient.get("/atoms", { params }).then(res => res.data);
}

export function fetchAtomById(id) {
  return axiosClient.get(`/atoms/${id}`).then(res => res.data);
}
  