import { ElementRef } from '@angular/core';


declare var OPEN_CV_READY: boolean;
declare var cv: any;


const SETTING = {
  VERTICAL_LINE_LENGTH_THRESHOLD: 0.04,
  IMAGE_DISPLAY_MAX_HEIGHT: 800,
};


export class TextAnnotation {
  desc: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;

  constructor([desc, minX, maxX, minY, maxY]: [string, number, number, number, number]) {
    this.desc = desc;
    this.minX = minX
    this.maxX = maxX
    this.minY = minY
    this.maxY = maxY
  }

  ShouldMerge(other: TextAnnotation) {
    let has_overlap = this.minY <= other.minY && other.minY <= this.maxY;
    has_overlap ||= other.minY <= this.minY && this.minY <= other.maxY;

    if (!has_overlap)
      return false;
    if (this.maxX > other.minX)
      // My right boundary is in the right of the left boundary of other
      return false;
    //if (this.maxX + 8 < other.minX)
      //// The gap between to boxes is too large
      //return false;
    return true;
  }

  Merge(other: TextAnnotation) {
    this.desc += other.desc;
    this.minX = Math.min(this.minX, other.minX);
    this.maxX = Math.max(this.maxX, other.maxX);
    this.minY = Math.min(this.minY, other.minY);
    this.maxY = Math.max(this.maxY, other.maxY);
  }
};


async function DetectBoundary(imgRef: ElementRef): Promise<TextAnnotation[]> {
  console.info('start DetectBoundary');
  const img = imgRef.nativeElement;
  const image = cv.imread(img);
  const edgeImage = new cv.Mat();

  // Turn into gray scale.
  cv.cvtColor(image, edgeImage, cv.COLOR_RGB2GRAY, 0);
  cv.blur(edgeImage, edgeImage, new cv.Size(3, 3));
  const lowThreshold = 5;
  const ratio = 3;
  const kernelSize = 3;
  cv.Canny(edgeImage, edgeImage, lowThreshold, ratio * lowThreshold, kernelSize);

  // Detect vertical line pixels.
  let verticalStructure = cv.getStructuringElement(
    cv.MORPH_RECT,
    new cv.Size(1, SETTING.VERTICAL_LINE_LENGTH_THRESHOLD * edgeImage.rows));
  cv.erode(edgeImage, edgeImage, verticalStructure, new cv.Point(-1, -1));
  cv.dilate(edgeImage, edgeImage, verticalStructure, new cv.Point(-1, -1));

  // Merge nearby lines.
  const squareStructure = cv.getStructuringElement(
    cv.MORPH_RECT, new cv.Size(10, 10));
  cv.dilate(edgeImage, edgeImage, squareStructure, new cv.Point(-1, -1));
  cv.erode(edgeImage, edgeImage, squareStructure, new cv.Point(-1, -1));

  // Merge vertical lines.
  verticalStructure = cv.getStructuringElement(
    cv.MORPH_RECT, new cv.Size(1, edgeImage.rows / 10));
  cv.dilate(edgeImage, edgeImage, verticalStructure, new cv.Point(-1, -1));
  cv.erode(edgeImage, edgeImage, verticalStructure, new cv.Point(-1, -1));

  // Label pixels of vertical lines by finding connected components.
  const labelledImage = new cv.Mat(edgeImage.size(), cv.CV_16U);
  const labelCount = cv.connectedComponents(edgeImage, labelledImage, 8);
  const boxList = [];

  console.info('labelCount: ', labelCount);

  if (labelCount > 1) {
    for (let i = 0; i < labelCount - 1; i++) {
      boxList.push(
        new TextAnnotation(
          ['', labelledImage.cols+1, -1, labelledImage.rows+1, -1]));
    }
    for (let i = 0; i < labelledImage.rows; i++) {
      for (let j = 0; j < labelledImage.cols; j++) {
        const v = labelledImage.ucharPtr(i, j)[0];
        if (v == 0) continue;
        boxList[v - 1].Merge(new TextAnnotation(['', j, j, i, i]));
      }
    }
    boxList.sort((a, b) => {
      return a.minX - b.minX
    });
    for (let box of boxList) {
      console.info(box);
    }
  }

  labelledImage.delete();
  squareStructure.delete();
  verticalStructure.delete();
  edgeImage.delete();
  image.delete();

  return boxList;
}


function FindColumn(boundaryList: TextAnnotation[], text: TextAnnotation) {
  if (boundaryList.length === 0) return -1;
  for (let i = 0; i < boundaryList.length; i++) {
    if (text.maxX < boundaryList[i].minX) {
      return i;
    }
  }
  return boundaryList.length;
}


export async function ProcessTextAnnotation(
    imgRef: ElementRef, textAnnotations: TextAnnotation[]): Promise<[TextAnnotation[], number, number]> {
  const boundaryList = await DetectBoundary(imgRef);
  const retval: TextAnnotation[] = [];
  let width = 0;
  let height = 0;
  let index = -1;
  let currentColumn = -1;

  for (let text of textAnnotations) {
    // update width, height
    width = Math.max(text.maxX, width);
    height = Math.max(text.maxY, height);

    // Check if we should merge this box with previous one.
    if (index === -1) {
      retval.push(text);
      index++;
      continue;
    }

    let column = FindColumn(boundaryList, text);
    let shouldMerge = false;

    if (column === currentColumn && retval[index].ShouldMerge(text)) {
      retval[index].Merge(text);
    } else {
      retval.push(text);
      index++;
      currentColumn = column;
    }
  }

  return [retval, width, height];
}
