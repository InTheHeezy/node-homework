const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
        { name: "Bob", email: "bob@sample.com", password: "password" },
        { abortEarly: false },
    );
    expect(
        error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });

  it("2. The user schema requires that an email be specified", () => {
    const { error } = userSchema.validate(
        { name: "Bob", password: "Password1" },
        { abortEarly: false}, 
    );
    const emailError = error?.details?.find((detail) => detail.context.key === "email");
    expect(emailError).toBeDefined();
  });

  it("3. The user schema does not accept an invalid email", () => {
    const { error } = userSchema.validate(
        { name: "Bob", email: "notAValidEmail", password: "Password1" },
        { abortEarly: false}, 
    );
    expect(
        error.details.find((detail) => detail.context.key == "email")
    ).toBeDefined();
  });

  it("4. The user schema requires a password", () => {
    const { error } = userSchema.validate(
        { name: "Bob", email: "bob@sample.com"},
        { abortEarly: false },
    );
    const passError = error?.details?.find((detail) => detail.context.key === "password");
    expect(passError).toBeDefined();
  });

  it("5. The user schema requires name", () => {
    const { error } = userSchema.validate(
        {email: "bob@sample.com", password: "Password1" },
        { abortEarly: false },
    );
    const nameError = error?.details?.find((detail) => detail.context.key === "name");
    expect(nameError).toBeDefined();
  });

  it("6. The name must be valid (3 to 30 characters)", () => {
    const short = userSchema.validate(
        { name: "DZ", email: "bob@sample.com", password: "Password1" },
        { abortEarly: false}, 
    );
    const shortError = short.error?.details?.find((detail) => detail.context.key === "name");
    expect(shortError).toBeDefined();

    const long = userSchema.validate(
        {   
            name: "ThisNameIsMoreThanThirtyCharactersLong", 
            email: "bob@sample.com", 
            password: "Password1" 
        },
        { abortEarly: false}, 
    );
    const longError = long.error?.details?.find((detail) => detail.context.key === "name");
    expect(longError).toBeDefined();
  });

  it("7. If validation is performed on a valid user object, error comes back falsy", () => {
    const { error } = userSchema.validate(
        { name: "Bob", email: "bob@sample.com", password: "Password1"},
        { abortEarly: false },
    );

    expect(error).toBeFalsy();
  });
});

describe("task object validation tests", () => {
    it("8. The task schema requires a title", () => {
        const { error } = taskSchema.validate(
            { isCompleted: "false", priority: "medium" },
            { abortEarly: false },
        );
        const titleError = error?.details?.find((detail) => detail.context.key === "title");
        expect(titleError).toBeDefined();
    });    

    it("9. If an isCompleted value is specified, it must be valid", () => {
        const { error } = taskSchema.validate(
            { title: "TaskOne", isCompleted: "NotValid", priority: "medium"},
            { abortEarly: false },
        );
        expect(
            error?.details?.find((detail) => detail.context.key == "isCompleted"),
        ).toBeDefined();
    });

    it("10. If an isCompleted value is not specified but the rest of the object is valid, a default of false is provided by validation", () => {
        const { error, value } = taskSchema.validate(
            { title: "TaskOne", priority: "medium"},
            { abortEarly: false },
        );
        expect(error).toBeFalsy();
        expect(value.isCompleted).toBe(false);
    });

    it("11. If isCompleted in the provided object has the value true, it remains true after validation", () => {
        const { error, value } = taskSchema.validate(
            { title: "TaskOne", isCompleted: "true", priority: "medium"},
            { abortEarly: false },
        );
        expect(error).toBeFalsy();
        expect(value.isCompleted).toBe(true);
    });
});

describe("patch task validation tests", () => {
    it("12. The patchTaskSchema does not require a title", () => {
        const { error } = patchTaskSchema.validate(
            { isCompleted: "false", priority: "medium" },
            { abortEarly: false },
        );
        expect(error).toBeFalsy();
    });

    it("13. If no value is provided for isCompleted this remains undefined in the returned value", () => {
        const { error, value } = patchTaskSchema.validate(
            { title: "Updated Task Title" },
            { abortEarly: false },
        );
        expect(error).toBeFalsy();
        expect(value.isCompleted).toBeUndefined();
    });
});