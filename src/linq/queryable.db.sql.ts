// sql.provider.ts

import { DatabaseQueryable, ISqlQueryProvider, QueryExpression } from "./queryable.db.js";
import { IQueryable } from "./queryable.js";

/// <summary>
/// A SQL query provider that translates LINQ-like expressions into SQL.
/// </summary>
export abstract class SqlQueryProvider implements ISqlQueryProvider {
    constructor(public connection: any) {}

    createQuery<T>(expression: QueryExpression): IQueryable<T> {
        return new DatabaseQueryable<T>(this, expression);
    }

    execute<T>(expression: QueryExpression): T {
        const sql = this.translateExpression(expression);
        console.log("Executing SQL:", sql);

        // FIXME: In a real implementation, run sql against DB connection
        // Example: return this.connection.query(sql);
        return [] as unknown as T;
    }

    protected translateExpression(expression: QueryExpression): string {
        if (!expression) return "SELECT * FROM Table";

        const sourceSql = expression.source
            ? this.translateExpression(expression.source)
            : "SELECT * FROM Table";

        switch (expression.type) {
            case "Where":
                return `${sourceSql} WHERE ${this.translatePredicate(expression.args[0])}`;
            case "Select":
                return `SELECT ${this.translateSelector(expression.args[0])} FROM (${sourceSql}) AS SubQuery`;
            case "SelectMany":
                return `SELECT ${this.translateSelector(expression.args[0])} FROM (${sourceSql}) AS SubQuery`;
            case "Skip":
                return `${sourceSql} OFFSET ${expression.args[0]} ROWS`;
            case "Take":
                return `${sourceSql} LIMIT ${expression.args[0]}`;
            case "OrderBy":
                return `${sourceSql} ORDER BY ${this.translateKeySelector(expression.args[0])} ASC`;
            case "OrderByDescending":
                return `${sourceSql} ORDER BY ${this.translateKeySelector(expression.args[0])} DESC`;
            case "GroupBy":
                return `${sourceSql} GROUP BY ${this.translateKeySelector(expression.args[0])}`;
            case "Join":
                return this.translateJoin(expression, sourceSql);
            case "Count":
                return `SELECT COUNT(*) FROM (${sourceSql}) AS SubQuery`;
            case "Sum":
                return `SELECT SUM(${this.translateSelector(expression.args[0])}) FROM (${sourceSql}) AS SubQuery`;
            case "Average":
                return `SELECT AVG(${this.translateSelector(expression.args[0])}) FROM (${sourceSql}) AS SubQuery`;
            case "Min":
                return `SELECT MIN(${this.translateSelector(expression.args[0])}) FROM (${sourceSql}) AS SubQuery`;
            case "Max":
                return `SELECT MAX(${this.translateSelector(expression.args[0])}) FROM (${sourceSql}) AS SubQuery`;
            case "Any":
                return `SELECT CASE WHEN EXISTS(${sourceSql}) THEN 1 ELSE 0 END`;
            case "All":
                // Harder to translate directly; abstract
                return this.translateAll(expression.args[0], sourceSql);
            case "First":
                return `${sourceSql} LIMIT 1`;
            case "FirstOrDefault":
                return `${sourceSql} LIMIT 1`;
            case "Single":
                return `${sourceSql} LIMIT 2`; // enforce single check in execution
            case "SingleOrDefault":
                return `${sourceSql} LIMIT 2`;
            case "Find":
                return `${sourceSql} WHERE ${this.translatePredicate(expression.args[0])} LIMIT 1`;
            default:
                return sourceSql;
        }
    }

    // Abstract methods — must be implemented by concrete SQL provider
    protected abstract translatePredicate(predicate: Function): string;
    protected abstract translateSelector(selector: Function): string;
    protected abstract translateKeySelector(selector: Function): string;
    protected abstract translateJoin(expression: QueryExpression, sourceSql: string): string;
    protected abstract translateAll(predicate: Function, sourceSql: string): string;
}

// ### Example Usage

// ```ts
// const provider = new SqlQueryProvider(myDbConnection);
// const users = new DatabaseQueryable<User>(provider, { type: "Root", args: [] });

// const query = users
//     .where(u => u.age > 18)
//     .orderBy(u => u.name)
//     .select(u => ({ u.id, u.name }));

// const results = query.toArray(); // Executes SQL via provider
// ```

// ✅ **Summary**  
// - `DatabaseQueryable<T>` builds a query expression tree.  
// - `SqlQueryProvider` translates that tree into SQL.  
// - `execute()` runs the SQL against the database connection.  
// - This mirrors EF Core’s LINQ‑to‑SQL pipeline: deferred query composition, execution only at materialization.  

// # Example implements

// export abstract class PostgresQueryProvider extends SqlQueryProvider {
//     protected translatePredicate(predicate: Function): string {
//         // Example: parse function string, very naive
//         return "age > 18";
//     }

//     protected translateSelector(selector: Function): string {
//         return "*"; // map to actual columns
//     }

//     protected translateKeySelector(selector: Function): string {
//         return "name"; // map to actual column
//     }

//     protected translateJoin(expression: QueryExpression, sourceSql: string): string {
//         return `${sourceSql} INNER JOIN OtherTable ON ...`;
//     }

//     protected translateAll(predicate: Function, sourceSql: string): string {
//         return `SELECT CASE WHEN NOT EXISTS(${sourceSql} WHERE NOT (${this.translatePredicate(predicate)})) THEN 1 ELSE 0 END`;
//     }
// }
