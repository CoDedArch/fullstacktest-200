import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CHECK_EMAIL_URL, LOGIN_URL, SIGN_UP_URL } from "./constants/constants";

const Introduction = ({ onComplete }: { onComplete: () => void }) => {
  const [showAuthOptions, setShowAuthOptions] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [step, setStep] = useState<"email" | "details">("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [isWaitingForVerification, setIsWaitingForVerification] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
  };

  const checkEmailExists = async (email: string) => {
    try {
      const response = await fetch(CHECK_EMAIL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to check email existence.");
      }

      return data.exists;
    } catch (err) {
      console.error("Error checking email:", err);
      throw err;
    }
  };

  const handleNext = async () => {
    if (isLogin) {
      await handleLoginSubmit();
      return;
    }

    if (step === "email") {
      if (!validateEmail(email)) {
        setError("Please enter a valid email address.");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const emailExists = await checkEmailExists(email);

        if (emailExists) {
          setError(
            "This email is already registered. Please log in or use a different email."
          );
        } else {
          setStep("details");
        }
      } catch (err) {
        setError(
          (err as Error).message ||
            "An error occurred while checking the email. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    } else if (step === "details") {
      if (!validatePassword(password)) {
        setError(
          "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character."
        );
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      await handleSignUpSubmit();
    }
  };

  const handleSignUpSubmit = async () => {
    const userData = {
      email,
      first_name: firstName,
      last_name: lastName,
      password,
    };

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(SIGN_UP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Signup failed. Please try again.");
      }

      setIsWaitingForVerification(true);
      setShowAuthOptions(false);

      const pollVerificationStatus = async () => {
        try {
          const loginResponse = await fetch(LOGIN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: userData.email,
              password: userData.password,
            }),
          });

          if (loginResponse.ok) {
            clearInterval(pollingInterval);
            setShowCheckmark(true);
            setTimeout(() => {
              setIsWaitingForVerification(false);
              setShowCheckmark(false);
              onComplete();
              window.location.reload();
            }, 1500);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      };

      const pollingInterval = setInterval(pollVerificationStatus, 5000);
    } catch (err) {
      setError(
        (err as Error).message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed. Please try again.");
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("isLoggedIn", "true");
      const expirationTime = Date.now() + 30 * 60 * 1000;
      localStorage.setItem("token_expiry", expirationTime.toString());

      setShowCheckmark(true);

      setTimeout(() => {
        setShowAuthOptions(false);
        setShowCheckmark(false);
        onComplete();
        window.location.reload();
      }, 1500);

      setEmail("");
      setPassword("");
      setError("");
    } catch (err) {
      setError(
        (err as Error).message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <>
          {(showAuthOptions || isWaitingForVerification) && (
            <motion.section
              key="auth-options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                background: "linear-gradient(135deg, #A8DADC, #457B9D)",
              }}
              className="absolute w-full inset-0 z-50 flex flex-col items-center justify-center pt-10 sm:pt-0 space-y-10 sm:space-y-30"
            >
              <motion.h2
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-white text-2xl sm:text-4xl font-extrabold pl-10"
              >
                {isWaitingForVerification
                  ? "🎉 One last step! Verify your email to unlock the full KeyMap experience. 🎉"
                  : ""}
              </motion.h2>
              <div className="flex flex-wrap gap-18 justify-center pb-10 p-2">
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#457B9D",
                  }}
                  className="w-fit px-6 py-2 pb-10 rounded-lg hover:cursor-pointer shadow-2xl shadow-black hover:bg-[#F0F4F8] transition-colors text-xl font-bold"
                >
                  <h1 className="text-3xl text-black font-bold text-center">
                    {isWaitingForVerification
                      ? "KeyMap Team 📖😊"
                      : isLogin
                      ? "Login to KeyMap"
                      : "Create your KeyMap account"}
                  </h1>
                  <div className="space-y-3">
                    <h2 className="text-sm text-center text-black font-bold">
                      {isLogin
                        ? "Welcome back! Please log in to continue."
                        : "Generate your Project Schemas, effortlessly with KeyMap"}
                    </h2>
                    <h2
                      className={`text-lg text-center text-blue-500 font-bold  ${
                        isWaitingForVerification ? "hidden" : ""
                      }`}
                    >
                      {isLogin ? (
                        <>
                          Don't have an account?{" "}
                          <span
                            className="underline text-black cursor-pointer"
                            onClick={() => {
                              setIsLogin(false);
                              setStep("email");
                            }}
                          >
                            Sign up
                          </span>
                          {showCheckmark && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.8 }}
                              className="flex justify-center"
                            >
                              <img
                                src="/assets/check.png"
                                alt="check mark"
                                className="w-20"
                              />
                            </motion.div>
                          )}
                        </>
                      ) : (
                        <>
                          Already have an account?{" "}
                          <span
                            className="underline text-black cursor-pointer"
                            onClick={() => {
                              setIsLogin(true);
                              setStep("email");
                            }}
                          >
                            Login
                          </span>
                        </>
                      )}
                    </h2>
                  </div>
                  {isWaitingForVerification && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-center text-blue-500 font-bold pt-10"
                    >
                      Waiting for email verification. Please check your inbox.
                      {showCheckmark && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.8 }}
                          className="flex justify-center pt-5"
                        >
                          <img
                            src="/assets/check.png"
                            alt="check mark"
                            className="w-20"
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className={`mt-10 space-y-2 ${
                      isWaitingForVerification ? "hidden" : ""
                    }`}
                  >
                    {!isLogin && step === "details" && (
                      <div>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="border-2 w-full h-13 rounded-2xl p-2"
                          placeholder="First Name"
                          required
                        />
                      </div>
                    )}
                    {!isLogin && step === "details" && (
                      <div>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="border-2 w-full h-13 rounded-2xl p-2"
                          placeholder="Last Name"
                          required
                        />
                      </div>
                    )}
                    <div className={`${step === "details" ? "hidden" : ""}`}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-2 w-full h-13 rounded-2xl p-2"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    {(isLogin || step === "details") && (
                      <div>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="border-2 w-full h-13 rounded-2xl p-2"
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                    )}
                    {!isLogin && step === "details" && (
                      <div>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="border-2 w-full h-13 rounded-2xl p-2"
                          placeholder="Confirm Password"
                          required
                        />
                      </div>
                    )}
                    {error && <p className={`text-red-500 text-sm`}>{error}</p>}
                    {isLoading ? (
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="border-2 w-full h-13 rounded-2xl text-black bg-blue-100 hover:bg-blue-200 transition-colors"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          </div>
                        ) : isLogin ? (
                          "Login"
                        ) : step === "email" || step === "details" ? (
                          "Next"
                        ) : (
                          "Submit"
                        )}
                      </button>
                    )}
                  </form>
                </motion.div>
              </div>
            </motion.section>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default Introduction;
