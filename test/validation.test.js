const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
        { name: "Bob", email: "bob@sample.com", password: "password" },
        { abortEarly: false },
    );
    const passwordError = !!error?.details?.find((detail) => detail.context.key == "password");
    expect(passwordError).toBe(true);
  });

  it("2. The user schema requires that an email be specified", () => {
    const { error } = userSchema.validate(
        { name: "Bob", password: "Password1" },
        { abortEarly: false}, 
    );
    const emailError = !!error?.details?.find((detail) => detail.context.key === "email");
    expect(emailError).toBe(true);
  });

  it("3. The user schema does not accept an invalid email", () => {
    const { error } = userSchema.validate(
        { name: "Bob", email: "notAValidEmail", password: "Password1" },
        { abortEarly: false}, 
    );
    const emailError = !!error?.details?.find((detail) => detail.context.key === "email");
    expect(emailError).toBe(true);
  });

  it("4. The user schema requires a password", () => {
    const { error } = userSchema.validate(
        { name: "Bob", email: "bob@sample.com"},
        { abortEarly: false },
    );
    const passError = !!error?.details?.find((detail) => detail.context.key === "password");
    expect(passError).toBe(true);
  });

  it("5. The user schema requires name", () => {
    const { error } = userSchema.validate(
        {email: "bob@sample.com", password: "Password1" },
        { abortEarly: false },
    );
    const nameError = !!error?.details?.find((detail) => detail.context.key === "name");
    expect(nameError).toBe(true);
  });

  it("6. The name must be valid (3 to 30 characters)", () => {
    const short = userSchema.validate(
        { name: "DZ", email: "bob@sample.com", password: "Password1" },
        { abortEarly: false}, 
    );

    const long = userSchema.validate(
        {   
            name: "ThisNameIsMoreThanThirtyCharactersLong", 
            email: "bob@sample.com", 
            password: "Password1" 
        },
        { abortEarly: false}, 
    );
    const shortError = !!short.error?.details?.find((detail) => detail.context.key === "name");
    const longError = !!long.error?.details?.find((detail) => detail.context.key === "name");
    expect(shortError && longError).toBe(true);
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
            { isCompleted: false },
            { abortEarly: false },
        );
        const titleError = error?.details?.find((detail) => detail.context.key === "title");
        expect(titleError).toBeDefined();
    });    

    it("9. If an isCompleted value is specified, it must be valid", () => {
        const { error } = taskSchema.validate(
            { title: "TaskOne", isCompleted: "NotValid"},
            { abortEarly: false },
        );
        const isCompletedError = !!error?.details?.some(
            (detail) => detail.context?.key === "isCompleted"
        );
        expect(isCompletedError).toBe(true);
    });

    it("10. If an isCompleted value is not specified but the rest of the object is valid, a default of false is provided by validation", () => {
        const { value } = taskSchema.validate(
            { title: "TaskOne" },
            { abortEarly: false },
        );
        expect(value?.isCompleted).toBe(false);
    });

    it("11. If isCompleted in the provided object has the value true, it remains true after validation", () => {
        const { error, value } = taskSchema.validate(
            { title: "TaskOne", isCompleted: true },
            { abortEarly: false },
        );
        expect({ error, isCompleted: value?.isCompleted }).toEqual({
            error: undefined,
            isCompleted: true
        });
    });
});

describe("patch task validation tests", () => {
    it("12. The patchTaskSchema does not require a title", () => {
        const { error } = patchTaskSchema.validate(
            { isCompleted: false },
            { abortEarly: false },
        );
        const titleError = !!error?.details?.some((detail) => detail.context?.key === "title");
        expect(titleError).toBe(false);
    });

    it("13. If no value is provided for isCompleted this remains undefined in the returned value", () => {
        const { error, value } = patchTaskSchema.validate(
            { title: "Updated Task Title" },
            { abortEarly: false },
        );
        expect(value?.isCompleted).toBeUndefined();
    });
});