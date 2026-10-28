"""Read-only original/generated feature registration; never edits image pixels."""
from pathlib import Path
import json,cv2,numpy as np
root=Path(__file__).resolve().parents[2]
for family in ['pump','boat']:
 folder=root/'docs/story-room-boundaries'/('art-'+family+'-reference');rows=[]
 for side in ['left','right']:
  source=cv2.imread(str(folder/(side+'-input.png')),cv2.IMREAD_COLOR);generated=cv2.imread(str(folder/(side+'-generated.png')),cv2.IMREAD_UNCHANGED)
  scaled=cv2.resize(generated[:,:,:3],(320,900),interpolation=cv2.INTER_AREA);roi=np.zeros((900,320),np.uint8)
  if family=='pump':roi[20:620,80:260 if side=='left' else 230]=255
  elif side=='left':roi[725:835,95:175]=255
  else:roi[725:835,150:235]=255
  sift=cv2.SIFT_create(nfeatures=4000,contrastThreshold=.012,edgeThreshold=16)
  k1,d1=sift.detectAndCompute(cv2.cvtColor(source,cv2.COLOR_BGR2GRAY),roi);k2,d2=sift.detectAndCompute(cv2.cvtColor(scaled,cv2.COLOR_BGR2GRAY),None)
  matches=cv2.BFMatcher().knnMatch(d1,d2,k=2);good=[m for m,n in matches if m.distance<.78*n.distance]
  src=np.float32([k1[m.queryIdx].pt for m in good]);dst=np.float32([k2[m.trainIdx].pt for m in good])
  affine,inliers=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=3,maxIters=20000,confidence=.999)
  if affine is None:raise RuntimeError(f'{family}/{side} cannot register: {len(good)} matches')
  errs=np.linalg.norm((np.c_[src,np.ones(len(src))]@affine.T)-dst,axis=1);active=errs[inliers[:,0]>0]
  row={'side':side,'originalCanvas':[320,900],'generatedCanvas':[generated.shape[1],generated.shape[0]],'sourceToNormalizedGenerated':affine.tolist(),'matches':len(good),'inliers':int(inliers.sum()),'residualMedianSourcePixels':float(np.median(active)),'residualP95SourcePixels':float(np.percentile(active,95)),'sourcePoints':src[inliers[:,0]>0].tolist(),'generatedPointsNormalized':dst[inliers[:,0]>0].tolist()}
  rows.append(row);print(family,side,'matches',len(good),'inliers',row['inliers'],'affine',affine.tolist(),'p95',row['residualP95SourcePixels'])
 (folder/'registration.json').write_text(json.dumps(rows,indent=2)+'\n')
