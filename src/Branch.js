import { constants } from './utils';

import nodeRenderers from './nodeRenderers';

const { Angles, Shapes } = constants;

/**
 * Cached objects to reduce garbage
 */
const _bounds = {
  minx: 0,
  maxx: 0,
  miny: 0,
  maxy: 0,
};

const _leafStyle = {
  lineWidth: null,
  strokeStyle: null,
  fillStyle: null,
};

/**
 * Creates a branch
 *
 * @constructor
 * @memberof PhyloCanvas
 * @public
 *
 */
export default class Branch {

  constructor() {
    /**
     * The angle clockwise from horizontal the branch is (Used paricularly for
     * Circular and Radial Trees)
     * @public
     *
     */
    this.angle = 0;

    /**
     * The Length of the branch
     */
    this.branchLength = false;

    /**
     * The Canvas DOM object the parent tree is drawn on
     */
    this.canvas = null;

    /**
     * The center of the end of the node on the x axis
     */
    this.centerx = 0;

    /**
     * The center of the end of the node on the y axis
     */
    this.centery = 0;

    /**
     * the branches that stem from this branch
     */
    this.children = [];

    /**
     * true if the node has been collapsed
     * @type Boolean
     */
    this.collapsed = false;

    /**
     * Custom colour for branch, initialised as null to use tree-level default
     */
    this.colour = null;

    /**
     * an object to hold custom data for this node
     */
    this.data = {};

    /**
     * This node's highlight status
     */
    this.highlighted = false;

    /**
     * Whether the user is hovering over the node
     */
    this.hovered = false;

    /**
     * This node's unique ID
     */
    this.id = '';

    /**
     * when the branch drawing algorithm needs to switch. For example: where the
     * Circular algorithm needs to change the colour of the branch.
     */
    this.interx = 0;

    /**
     * when the branch drawing algorithm needs to switch. For example: where the
     * Circular algorithm needs to change the colour of the branch.
     */
    this.intery = 0;
    /**
     * The text lable for this node
     */
    this.label = null;

    /**
     * If true, this node have no children
     */
    this.leaf = true;

    /**
     * the angle that the last child of this brach 'splays' at, used for
     * circular and radial trees
     */
    this.maxChildAngle = 0;

    /**
     * the angle that the last child of this brach 'splays' at, used for
     * circular and radial trees
     */
    this.minChildAngle = Angles.FULL;

    /**
     * What kind of teminal should be drawn on this node
     */
    //this.nodeShape = 'circle';
    this.nodeShape = 'rectangle';

    /**
     * The parent branch of this branch
     */
    this.parent = null;

    /**
     * The relative size of the terminal of this node
     */
    this.radius = 10.0;

    /**
     * true if this branch is currently selected
     */
    this.selected = false;

    /**
     * the x position of the start of the branch
     * @type double
     */
    this.startx = 0;

    /**
     * the y position of the start of the branch
     * @type double
     */
    this.starty = 0;

    /**
     * The length from the root of the tree to the tip of this branch
     */
    this.totalBranchLength = 0;

    /**
     * The tree object that this branch is part of
     * @type Tree
     */
    this.tree = {};

    /**
     * If true, the leaf and label are not rendered.
     */
    this.pruned = false;

    /**
     * Allows label to be individually styled
     */
    this.labelStyle = {};

    /**
     * If false, branch does not respond to mouse events
     */
    this.interactive = true;

    /**
     * Defines leaf style (lineWidth, strokeStyle, fillStyle) for individual
     * leaves, independent of branch colour.
     */
    this.leafStyle = {};
  }

  /**
   * used for auto ids for internal nodes
   * @static
   */
  static lastId = 0;

  static generateId() {
    return 'pcn' + this.lastId++;
  }

  get isHighlighted() {
    return this.highlighted || this.hovered;
  }

  clicked(x, y) {
    var i;
    var child;

    if (this.dragging) {
      return;
    }
    if ((x < (this.maxx) && x > (this.minx)) &&
        (y < (this.maxy) && y > (this.miny))) {
      return this;
    }

    for (i = this.children.length - 1; i >= 0; i--) {
      child = this.children[i].clicked(x, y);
      if (child) {
        return child;
      }
    }
  }

  drawLabel() {
    var fSize = this.getTextSize();
    var label = this.getLabel();

    this.canvas.font = this.getFontString();
    this.labelWidth = this.canvas.measureText(label).width;

    // finding the maximum label length
    if (this.tree.maxLabelLength[this.tree.treeType] === undefined) {
      this.tree.maxLabelLength[this.tree.treeType] = 0;
    }
    if (this.labelWidth > this.tree.maxLabelLength[this.tree.treeType]) {
      this.tree.maxLabelLength[this.tree.treeType] = this.labelWidth;
    }

    let tx = this.getLabelStartX();

    if (this.tree.alignLabels) {
      tx += Math.abs(this.tree.labelAlign.getLabelOffset(this));
    }

    if (this.angle > Angles.QUARTER &&
        this.angle < (Angles.HALF + Angles.QUARTER)) {
      this.canvas.rotate(Angles.HALF);
      // Angles.Half text position changes
      tx = -tx - (this.labelWidth * 1);
    }

    this.canvas.beginPath();
    this.canvas.fillStyle = this.getTextColour();
    this.canvas.fillText(label, tx, (fSize / 2) );
    this.canvas.closePath();

    // Rotate canvas back to original position
    if (this.angle > Angles.QUARTER &&
        this.angle < (Angles.HALF + Angles.QUARTER)) {
      this.canvas.rotate(Angles.HALF);
    }
  }

  setNodeDimensions(centerX, centerY, radius) {
    let boundedRadius = radius;

    if ((radius * this.tree.zoom) < 5 || !this.leaf) {
      boundedRadius = 5 / this.tree.zoom;
    }

    this.minx = centerX - boundedRadius;
    this.maxx = centerX + boundedRadius;
    this.miny = centerY - boundedRadius;
    this.maxy = centerY + boundedRadius;
  }

  drawCollapsed(centerX, centerY) {
    const childIds = this.getChildProperties('id');
    let radius = childIds.length;

    if (this.tree.scaleCollapsedNode) {
      radius = this.tree.scaleCollapsedNode(radius);
    }

    this.canvas.globalAlpha = 0.3;

    this.canvas.beginPath();

    this.canvas.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    this.canvas.fillStyle = (this.tree.defaultCollapsed.color) ?
                      this.tree.defaultCollapsed.color : 'purple';
    this.canvas.fill();
    this.canvas.globalAlpha = 1;

    this.canvas.closePath();
  }

  drawLabelConnector() {
    const { highlightColour, labelAlign } = this.tree;
    this.canvas.save();

    this.canvas.lineWidth = this.canvas.lineWidth / 4;
    this.canvas.strokeStyle =
      this.isHighlighted ? highlightColour : this.getColour();

    this.canvas.beginPath();
    this.canvas.moveTo(this.getRadius(), 0);
    this.canvas.lineTo(labelAlign.getLabelOffset(this) + this.getDiameter(), 0);
    this.canvas.stroke();
    this.canvas.closePath();

    this.canvas.restore();
  }

  drawLeaf() {
    const { alignLabels, canvas } = this.tree;
    let offset = 0;
    if (alignLabels) {
      this.drawLabelConnector();
      offset = this.getLabelStartX() + Math.abs(this.tree.labelAlign.getLabelOffset(this));
    }
    if (this.tree.showLabels || (this.tree.hoverLabel && this.isHighlighted)) {
      this.drawLabel();
    }
    let other_data = {};
    other_data.offset = Math.abs(offset);
    if (this.metadata) {
      other_data.metadata = this.metadata;
    }
    
    other_data.rect_multiplier = this.tree.rect_multiplier;
    
    nodeRenderers[this.nodeShape](canvas,  this.getRadius() , this.getLeafStyle(), other_data);    
  }

  drawHighlight(centerX, centerY) {
    this.canvas.save();
    this.canvas.beginPath();

    this.canvas.strokeStyle = this.tree.highlightColour;
    this.canvas.lineWidth = this.getHighlightLineWidth();
    const radius = this.getHighlightRadius();
    this.canvas.arc(centerX, centerY, radius, 0, Angles.FULL, false);

    this.canvas.stroke();

    this.canvas.closePath();
    this.canvas.restore();
  }

  drawNode() {
    var nodeRadius = this.getRadius();
    /**
     * theta = translation to center of node... ensures that the node edge is
     * at the end of the branch so the branches don't look shorter than  they
     * should
     */
    var theta = nodeRadius;

    var centerX = this.leaf ?
      (theta * Math.cos(this.angle)) + this.centerx : this.centerx;
    var centerY = this.leaf ?
      (theta * Math.sin(this.angle)) + this.centery : this.centery;

    this.setNodeDimensions(centerX, centerY, nodeRadius);

    if (this.collapsed) {
      this.drawCollapsed(centerX, centerY);
    } else if (this.leaf) {
      this.canvas.save();
      this.canvas.translate(this.centerx, this.centery);
      this.canvas.rotate(this.angle);

      this.drawLeaf();

      this.canvas.restore();
    }

    if (this.isHighlighted) {
      this.tree.highlighters.push(this.drawHighlight.bind(this, centerX, centerY));
    }
  }

  getChildProperties(property) {
    if (this.leaf) {
      // Fix for Issue #68
      // Returning array, as expected
      return [ this[property] ];
    }

    let children = [];
    for (let x = 0; x < this.children.length; x++) {
      children = children.concat(this.children[x].getChildProperties(property));
    }
    return children;
  }

  getChildCount() {
    if (this.leaf) return 1;

    let children = 0;
    for (let x = 0; x < this.children.length; x++) {
      children += this.children[x].getChildCount();
    }
    return children;
  }

  getChildYTotal() {
    if (this.leaf) return this.centery;

    let y = 0;
    for (let i = 0; i < this.children.length; i++) {
      y += this.children[i].getChildYTotal();
    }
    return y;
  }

  cascadeFlag(property, value, predicate) {
    if (typeof this[property] === 'undefined') {
      throw new Error(`Unknown property: ${property}`);
    }
    if (typeof predicate === 'undefined' || predicate(this, property, value)) {
      this[property] = value;
    }
    for (const child of this.children) {
      child.cascadeFlag(property, value, predicate);
    }
  }

  reset() {
    var child;
    var i;

    this.startx = 0;
    this.starty = 0;
    this.centerx = 0;
    this.centery = 0;
    this.angle = null;
    // this.totalBranchLength = 0;
    this.minChildAngle = Angles.FULL;
    this.maxChildAngle = 0;
    for (i = 0; i < this.children.length; i++) {
      try {
        this.children[child].pcReset();
      } catch (e) {
        return e;
      }
    }
  }

  redrawTreeFromBranch() {
    if (this.collapsed) {
      this.expand();
    }
    this.tree.redrawFromBranch(this);
  }

  extractChildren() {
    for (const child of this.children) {
      this.tree.storeNode(child);
      child.extractChildren();
    }
  }

  hasCollapsedAncestor() {
    if (this.parent) {
      return this.parent.collapsed || this.parent.hasCollapsedAncestor();
    }
    return false;
  }

  collapse() {
    // don't collapse the node if it is a leaf... that would be silly!
    this.collapsed = this.leaf === false;
  }

  expand() {
    this.collapsed = false;
  }

  toggleCollapsed() {
    if (this.collapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  setTotalLength() {
    var c;

    if (this.parent) {
      this.totalBranchLength = this.parent.totalBranchLength + this.branchLength;
      if (this.totalBranchLength > this.tree.maxBranchLength) {
        this.tree.maxBranchLength = this.totalBranchLength;
      }
    } else {
      this.totalBranchLength = this.branchLength;
      this.tree.maxBranchLength = this.totalBranchLength;
    }
    for (c = 0; c < this.children.length; c++) {
      this.children[c].setTotalLength();
    }
  }

  /**
   * Add a child branch to this branch
   * @param node {Branch} the node to add as a child
   * @memberof Branch
   */
  addChild(node) {
    node.parent = this;
    node.canvas = this.canvas;
    node.tree = this.tree;
    this.leaf = false;
    this.children.push(node);
  }

  /**
   * Return the node colour of all the nodes that are children of this one.
   */
  getChildColours() {
    var colours = [];

    this.children.forEach(function (branch) {
      var colour = branch.children.length === 0 ? branch.colour : branch.getColour();
      // only add each colour once.
      if (colours.indexOf(colour) === -1) {
        colours.push(colour);
      }
    });

    return colours;
  }

  /**
   * Get the colour(s) of the branch itself.
   */
  getColour(specifiedColour) {
    if (this.selected) {
      return this.tree.selectedColour;
    }

    return specifiedColour || this.colour || this.tree.branchColour;
  }

  getNwk(isRoot = true) {
    if (this.leaf) {
      return `${this.label}:${this.branchLength}`;
    }

    const childNwks = this.children.map(child => child.getNwk(false));
    return `(${childNwks.join(',')}):${this.branchLength}${isRoot ? ';' : ''}`;
  }

  getTextColour() {
    if (this.selected) {
      return this.tree.selectedColour;
    }

    if (this.isHighlighted) {
      return this.tree.highlightColour;
    }

    if (this.tree.backColour && this.children.length) {
      const childColours = this.getChildColours();
      if (childColours.length === 1) {
        return childColours[0];
      }
    }

    return this.labelStyle.colour || this.colour || this.tree.branchColour;
  }

  getLabel() {
    return (
      (this.label !== undefined && this.label !== null) ? this.label : ''
    );
  }

  getTextSize() {
    return this.labelStyle.textSize || this.tree.textSize;
  }

  getFontString() {
    const font = this.labelStyle.font || this.tree.font;
    return `${this.labelStyle.format || ''} ${this.getTextSize()}pt ${font}`;
  }

  getLabelSize() {
    this.canvas.font = this.getFontString();
    return this.canvas.measureText(this.getLabel()).width;
  }

  getRadius() {
    return this.leaf ?
      this.tree.baseNodeSize * this.radius :
      this.tree.baseNodeSize / this.radius;
  }

  getDiameter() {
    return this.getRadius() * 2;
  }

  hasLabelConnector() {
    if (!this.tree.alignLabels) {
      return false;
    }
    return (this.tree.labelAlign.getLabelOffset(this) > this.getDiameter());
  }

  /**
   * Calculates label start position
   * offset + aesthetic padding
   * @method getNodeSize
   * @return CallExpression
   */
  getLabelStartX(includeZoom = true) {
    const { lineWidth } = this.getLeafStyle(includeZoom);
    const hasLabelConnector = this.hasLabelConnector();

    let offset = this.getDiameter();

    if (this.isHighlighted && !hasLabelConnector) {
      offset += this.getHighlightSize(includeZoom) - this.getRadius();
    }

    if (!this.isHighlighted && !hasLabelConnector) {
      offset += lineWidth / 2;
    }

    return offset + Math.min(this.tree.labelPadding, this.tree.labelPadding / (includeZoom ? this.tree.zoom : 1));
  }

  getHighlightLineWidth(includeZoom = true) {
    return this.tree.highlightWidth / (includeZoom ? this.tree.zoom : 1);
  }

  getHighlightRadius(includeZoom = true) {
    let offset = this.getHighlightLineWidth(includeZoom) * this.tree.highlightSize;

    offset += this.getLeafStyle(includeZoom).lineWidth / this.tree.highlightSize;

    return this.leaf ? this.getRadius() + offset : offset * 0.666;
  }

  getHighlightSize(includeZoom = true) {
    return this.getHighlightRadius(includeZoom) + this.getHighlightLineWidth(includeZoom);
  }

  rotate(evt) {
    const newChildren = [];

    for (let i = this.children.length; i--; ) {
      newChildren.push(this.children[i]);
    }

    this.children = newChildren;

    if (!evt.preventredraw) {
      this.tree.extractNestedBranches();
      this.tree.draw(true);
    }
  }

  getChildNo() {
    return this.parent.children.indexOf(this);
  }

  setDisplay({ colour, shape, size, leafStyle, labelStyle }) {
    if (colour) {
      this.colour = colour;
    }
    if (shape) {
      this.nodeShape = Shapes[shape] ? Shapes[shape] : shape;
    }
    if (size) {
      this.radius = size;
    }
    if (leafStyle) {
      this.leafStyle = leafStyle;
    }
    if (labelStyle) {
      this.labelStyle = labelStyle;
    }
  }

  getTotalLength(includeZoom = true) {
    let length = this.getRadius();

    if (this.tree.showLabels || (this.tree.hoverLabel && this.isHighlighted)) {
      length += this.getLabelStartX(includeZoom) + this.getLabelSize();
    }

    return length;
  }

  getBounds() {
    const { tree } = this;
    const x = tree.alignLabels ? tree.labelAlign.getX(this) : this.centerx;
    const y = tree.alignLabels ? tree.labelAlign.getY(this) : this.centery;
    const nodeSize = this.getRadius();
    const totalLength = this.getTotalLength(false);

    let minx;
    let maxx;
    let miny;
    let maxy;
    if (this.angle > Angles.QUARTER &&
        this.angle < (Angles.HALF + Angles.QUARTER)) {
      minx = x + (totalLength * Math.cos(this.angle));
      miny = y + (totalLength * Math.sin(this.angle));
      maxx = x - nodeSize;
      maxy = y - nodeSize;
    } else {
      minx = x - nodeSize;
      miny = y - nodeSize;
      maxx = x + (totalLength * Math.cos(this.angle));
      maxy = y + (totalLength * Math.sin(this.angle));
    }

    // uses a caching object to reduce garbage
    const step = tree.prerenderer.getStep(tree);
    _bounds.minx = Math.min(minx, maxx, x - step);
    _bounds.miny = Math.min(miny, maxy, y - step);
    _bounds.maxx = Math.max(minx, maxx, x + step);
    _bounds.maxy = Math.max(miny, maxy, y + step);

    return _bounds;
  }

  getLeafStyle(includeZoom = true) {
    const { strokeStyle, fillStyle } = this.leafStyle;
    const { zoom } = this.tree;

    // uses a caching object to reduce garbage
    _leafStyle.strokeStyle = this.getColour(strokeStyle);
    _leafStyle.fillStyle = this.getColour(fillStyle);

    const lineWidth =
      typeof this.leafStyle.lineWidth !== 'undefined' ?
        this.leafStyle.lineWidth :
        this.tree.lineWidth;

    _leafStyle.lineWidth = lineWidth / (includeZoom ? zoom : 1);

    return _leafStyle;
  }

}
