export function universalLogger() {
  return function (schema) {
    // Get all the schema's method names
    const methods = Object.keys(schema.query);

    // Define a function that logs the operation
    const logOperation = function () {
      console.log(
        `Operation on ${
          this.model ? this.model.collection.name : ""
        } with query: `,
        JSON.stringify(this.getQuery()),
      );
    };

    // Loop through all the methods and attach the pre hook
    methods.forEach((method) => {
      schema.pre(method, logOperation);
    });
  };
}
