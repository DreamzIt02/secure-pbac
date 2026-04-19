import "./http/http.context.extensions.js"; // ensures challenge/forbidden are defined

import { AppContext } from "./App.context.js";
import { AuthenticationOptions } from "./http/authentication/index.js";
import { AuthorizationOptions } from "./core/index.js";
import { IdentityOptions } from "./core/options/index.js";
import { IdentityRole, IdentityUser } from "./core/types/index.js";

export class App extends AppContext {

    constructor(
    ) {
        super(new AuthenticationOptions(), new AuthorizationOptions(), new IdentityOptions())
    }
    // Override any Method of AppContext
    
}

export class AppUser extends IdentityUser<string> {
    constructor() {
        super()
    }
}

export class AppRole extends IdentityRole<string> {
    constructor() {
        super()
    }
}
