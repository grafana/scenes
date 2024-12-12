function isExtraQueryProvider(obj) {
  return typeof obj === "object" && "getExtraQueries" in obj;
}

export { isExtraQueryProvider };
//# sourceMappingURL=ExtraQueryProvider.js.map
