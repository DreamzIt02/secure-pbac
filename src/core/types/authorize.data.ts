
/**
 * Defines the set of data required to apply authorization rules to a resource.
 */
export interface IAuthorizeData
{
    /**
     * Gets or sets the policy name that determines access to the resource.
     */
    policy?: string;

    /**
     * Gets or sets a comma delimited list of roles that are allowed to access the resource.
     */
    roles?: string;

    /**
     * Gets or sets a comma delimited list of schemes from which user information is constructed.
     */
    authenticationSchemes?: string;
}

