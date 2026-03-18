const paths = {
  auth: {
    login: { label: "Login", href: "/login" },
  },
  public: {
    index: { label: "Home", href: "/" },
    "404": {
      label: "404",
      href: "*",
      redirect: (reason?: string) =>
        `*?reason=${encodeURIComponent(reason ?? "")}`,
    },
  },
  private: {},
};

export default paths;
