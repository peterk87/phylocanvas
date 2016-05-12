import { constants } from './utils';

const { Angles } = constants;

function drawConnector(canvas, connectingOffset) {
  canvas.beginPath();
  canvas.moveTo(0, 0);
  canvas.lineTo(connectingOffset, 0);
  canvas.stroke();
  canvas.closePath();
}

function commitPath(canvas, { lineWidth, strokeStyle, fillStyle }) {
  canvas.save();

  canvas.lineWidth = lineWidth;
  canvas.strokeStyle = strokeStyle;
  canvas.fillStyle = fillStyle;

  canvas.fill();
  if (lineWidth > 0 && strokeStyle !== fillStyle) {
    canvas.stroke();
  }

  canvas.restore();
}

const lengthOfSquareSide = (radius) => radius * Math.sqrt(2);

export default {

  circle(canvas, radius, style) {
    // circle takes same area as square inside given radius
    const scaledArea = Math.pow(lengthOfSquareSide(radius), 2);
    const scaledRadius = Math.sqrt(scaledArea / Math.PI);

    drawConnector(canvas, radius - scaledRadius);

    canvas.beginPath();
    canvas.arc(radius, 0, scaledRadius, 0, Angles.FULL, false);
    canvas.closePath();

    commitPath(canvas, style);
  },

  square(canvas, radius, style) {
    const lengthOfSide = lengthOfSquareSide(radius);
    const startX = radius - lengthOfSide / 2;

    drawConnector(canvas, startX);

    canvas.beginPath();
    canvas.moveTo(startX, 0);
    canvas.lineTo(startX, lengthOfSide / 2);
    canvas.lineTo(startX + lengthOfSide, lengthOfSide / 2);
    canvas.lineTo(startX + lengthOfSide, -lengthOfSide / 2);
    canvas.lineTo(startX, -lengthOfSide / 2);
    canvas.lineTo(startX, 0);
    canvas.closePath();

    commitPath(canvas, style);
  },

  star(canvas, radius, style) {
    const cx = radius;
    const cy = 0;
    const spikes = 5;
    const outerRadius = radius;
    const innerRadius = outerRadius * 0.5;
    const step = Math.PI / spikes;

    drawConnector(canvas, outerRadius - innerRadius);

    let rot = Math.PI / 2 * 3;

    canvas.beginPath();
    canvas.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      canvas.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      canvas.lineTo(x, y);
      rot += step;
    }
    canvas.lineTo(cx, cy - outerRadius);
    canvas.closePath();

    commitPath(canvas, style);
  },

  triangle(canvas, radius, style) {
    const lengthOfSide = (2 * radius) * Math.cos(30 * Math.PI / 180);
    const height = (Math.sqrt(3) / 2) * lengthOfSide;
    const midpoint = (1 / Math.sqrt(3)) * (lengthOfSide / 2);

    drawConnector(canvas, radius - midpoint);

    canvas.beginPath();
    canvas.moveTo(radius, midpoint);
    canvas.lineTo(radius + lengthOfSide / 2, midpoint);
    canvas.lineTo(radius, -(height - midpoint));
    canvas.lineTo(radius - lengthOfSide / 2, midpoint);
    canvas.lineTo(radius, midpoint);
    canvas.closePath();

    commitPath(canvas, style);
  },


  rectangle(canvas, radius, style, { offset, metadata, rect_multiplier }) {
    const lengthOfSide = lengthOfSquareSide(radius);
    if (!offset) {
      offset = radius;
    }
    let startX = offset - lengthOfSide / 2;
    let data = metadata;
    if (!data) {
      data = [{color: 'black', count: 1}];
    }
    let sum_counts = data.map( x => x.count )
                         .reduce( (x, y) => x+y );
    let max_y_length = sum_counts * rect_multiplier;
    for (let {color, count} of data) {
      let xLength = count / sum_counts * max_y_length;
      canvas.fillStyle = color;
      canvas.fillRect(startX, -lengthOfSide / 2, xLength, lengthOfSide)
      startX += xLength;
    }
  },

  circlestack(canvas, radius, style, { offset, metadata }) {
    // circle takes same area as square inside given radius
    const scaledArea = Math.pow(lengthOfSquareSide(radius), 2);
    const scaledRadius = Math.sqrt(scaledArea / Math.PI);

    let data = metadata;
    if (!data) {
      data = [{color: 'black', count: 1}];
    }
    let max_count = data.map( x => x.count ).reduce( (x, y) => Math.max(x, y) );
    let count = 0
    for (let {color, count} of data) {
      let current_radius = scaledRadius * (count / max_count);
      canvas.fillStyle = color;
      canvas.beginPath();
      if (count > 0) {
        offset += current_radius;
      }
      canvas.arc(offset, 0, current_radius, 0, Angles.FULL, false);
      canvas.lineTo(offset, 0)
      canvas.fill();
      canvas.closePath();
      offset += current_radius;
      count += 1;
    }
  },

  pie(canvas, radius, style, { offset, metadata }) {
    // circle takes same area as square inside given radius
    const scaledArea = Math.pow(lengthOfSquareSide(radius), 2);
    const scaledRadius = Math.sqrt(scaledArea / Math.PI);

    // drawConnector(canvas, offset - scaledRadius);

    let data = metadata;
    if (!data) {
      data = [{color: 'black', count: 1}];
    }
    let sum_counts = data.map( x => x.count )
                         .reduce( (x, y) => x+y );
    let start_angle = 0;
    let end_angle = 0;

    for (let {color, count} of data) {
      end_angle = start_angle + (count / sum_counts) * Angles.FULL;
      canvas.fillStyle = color;
      canvas.beginPath();
      canvas.arc(offset, 0, scaledRadius, start_angle, end_angle, false);
      canvas.lineTo(offset, 0)
      canvas.fill();
      canvas.closePath();
      start_angle = end_angle;
    }
  },

};
