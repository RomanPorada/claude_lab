import axiosClient from "./axiosClient";

export function fetchMolecules(params = {}) {
  return axiosClient.get("/molecules", { params }).then(res => res.data);
}

export function fetchMoleculeById(id) {
  return axiosClient.get(`/molecules/${id}`).then(res => res.data);
}
