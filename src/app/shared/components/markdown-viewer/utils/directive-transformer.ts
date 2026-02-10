import { visit } from 'unist-util-visit';

export default function remarkDirectiveTransformer() {
  return (tree: any) => {
    // Visit all directive nodes
    visit(tree, ['leafDirective', 'textDirective', 'containerDirective'], (node: any) => {
      node.directiveType = node.type;
      node.type = node.name;
    });
  };
}