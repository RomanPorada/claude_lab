import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import FormErrors from "../components/FormErrors/FormErrors";
import { clearCart } from "../redux/actions";
import { createOrder } from "../api/ordersApi";
import "./CheckoutPage.css";

const validationSchema = Yup.object().shape({
  firstName: Yup.string()
    .required("Ім'я обов'язкове")
    .min(2, "Ім'я має бути мінімум 2 символи")
    .max(50, "Ім'я не повинно перевищувати 50 символів")
    .matches(/^[a-яА-ЯёЁa-zA-Z\s-]+$/, "Ім'я може містити тільки букви, пробіли та дефіси"),
  
  lastName: Yup.string()
    .required("Прізвище обов'язкове")
    .min(2, "Прізвище має бути мінімум 2 символи")
    .max(50, "Прізвище не повинно перевищувати 50 символів")
    .matches(/^[a-яА-ЯёЁa-zA-Z\s-]+$/, "Прізвище може містити тільки букви, пробіли та дефіси"),
  
  email: Yup.string()
    .required("Email обов'язковий")
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
      "Email має невірний формат (наприклад: user@example.com)"
    ),
  
  phone: Yup.string()
    .required("Телефон обов'язковий")
    .matches(/^\d{10}$/, "Телефон має містити рівно 10 цифр")
    .length(10, "Телефон має містити рівно 10 цифр"),
  
  address: Yup.string()
    .required("Адреса обов'язкова")
    .min(5, "Адреса має бути мінімум 5 символів")
    .max(100, "Адреса не повинна перевищувати 100 символів"),
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((s) => s.cart || {});
  const user = useSelector((s) => s.user);
  const [submitError, setSubmitError] = React.useState("");
  const items = Object.values(cart);
  const total = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

  if (items.length === 0) {
    return (
      <div className="container checkout-page">
        <h1>Оформлення замовлення</h1>
        <p>Кошик порожній. <a href="/cart">Повернутися в кошик</a></p>
      </div>
    );
  }

  const handleSubmit = async (values) => {
    setSubmitError("");
    try {
      const saved = await createOrder({
        ...values,
        items: items.map(({ id, name, variant, quantity }) => ({ id, name, variant, quantity })),
      });
      localStorage.setItem(
        "order",
        JSON.stringify({ ...values, items, total, orderId: saved.data.id, date: saved.data.createdAt })
      );
      dispatch(clearCart());
      navigate("/success");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Не вдалося оформити замовлення. Спробуйте ще раз.");
    }
  };

  return (
    <div className="container checkout-page">
      <h1>Оформлення замовлення</h1>

      <div className="checkout-content">
        <div className="checkout-form">
          <h3>Ваші дані</h3>
          <Formik
            initialValues={{
              firstName: "",
              lastName: "",
              email: user?.email || "",
              phone: "",
              address: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, setFieldValue }) => {
              const handleFillMyData = () => {
                if (user?.firstName && user?.lastName) {
                  setFieldValue("firstName", user.firstName);
                  setFieldValue("lastName", user.lastName);
                  setFieldValue("email", user.email || "");
                }
              };

              return (
                <Form>
                  <FormErrors errors={errors} />

                  {user?.firstName && user?.lastName && (
                    <button
                      type="button"
                      className="fill-data-btn"
                      onClick={handleFillMyData}
                    >
                      📋 Мої дані
                    </button>
                  )}

                  <div className="form-group">
                    <label>Ім'я *</label>
                    <Field
                      name="firstName"
                      placeholder="Введіть ім'я"
                      className={touched.firstName && errors.firstName ? "error" : ""}
                    />
                    {touched.firstName && errors.firstName && (
                      <span className="field-error">{errors.firstName}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Прізвище *</label>
                    <Field
                      name="lastName"
                      placeholder="Введіть прізвище"
                      className={touched.lastName && errors.lastName ? "error" : ""}
                    />
                    {touched.lastName && errors.lastName && (
                      <span className="field-error">{errors.lastName}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <Field
                      name="email"
                      type="email"
                      placeholder="user@example.com"
                      className={touched.email && errors.email ? "error" : ""}
                    />
                    {touched.email && errors.email && (
                      <span className="field-error">{errors.email}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Телефон * (максимум 10 цифр)</label>
                    <Field
                      name="phone"
                      placeholder="0XX XXX-XX-XX"
                      className={touched.phone && errors.phone ? "error" : ""}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFieldValue('phone', e.target.value);
                      }}
                      maxLength={10}
                    />
                    {touched.phone && errors.phone && (
                      <span className="field-error">{errors.phone}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Адреса *</label>
                    <Field
                      name="address"
                      as="textarea"
                      placeholder="Вулиця, дім, квартира, місто"
                      className={touched.address && errors.address ? "error" : ""}
                    />
                    {touched.address && errors.address && (
                      <span className="field-error">{errors.address}</span>
                    )}
                  </div>

                  {submitError && <div className="field-error">{submitError}</div>}

                  <button type="submit" className="submit-btn">
                    Перейти до оплати
                  </button>
                </Form>
              );
            }}
          </Formik>
        </div>

        <div className="checkout-summary">
          <h3>Резюме замовлення</h3>
          <div className="summary-items">
            {items.map((item) => (
              <div key={`${item.id}-${item.variant}`} className="summary-item">
                <span>{item.name} ({item.variant})</span>
                <span>×{item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <strong>Всього позицій: {total}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
