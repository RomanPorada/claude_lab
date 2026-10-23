import axiosClient, { TOKEN_KEY } from "./axiosClient";

// Той самий контракт, що й у старого мока: resolve({success,user,message}) / reject({success:false,message})
function wrap(promise, okMessage) {
  return promise
    .then((res) => {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      return { success: true, user: res.data.user, message: okMessage };
    })
    .catch((err) => {
      throw {
        success: false,
        message: err.response?.data?.message || "Server is unavailable",
      };
    });
}

export const loginUser = (email, password) =>
  wrap(axiosClient.post("/auth/login", { email, password }), "Login successful");

export const registerUser = (firstName, lastName, email, password, confirmPassword) =>
  wrap(
    axiosClient.post("/auth/register", { firstName, lastName, email, password, confirmPassword }),
    "Registration successful"
  );
