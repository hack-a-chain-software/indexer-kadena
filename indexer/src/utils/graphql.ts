import { GraphQLResolveInfo, Kind } from 'graphql';

/**
 * Utility function to check if a specific field was requested in a GraphQL query
 * @param info - GraphQL resolve info containing the query AST
 * @param fieldName - The name of the field to check for
 * @returns true if the field was requested, false otherwise
 */
export function isFieldRequested(info: GraphQLResolveInfo, fieldName: string): boolean {
  const fieldNodes = info.fieldNodes;

  for (const fieldNode of fieldNodes) {
    if (fieldNode.selectionSet) {
      for (const selection of fieldNode.selectionSet.selections) {
        if (selection.kind === Kind.FIELD && selection.name.value === fieldName) {
          return true;
        }
      }
    }
  }

  return false;
}
