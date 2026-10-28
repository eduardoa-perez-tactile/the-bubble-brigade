"""Read-only feature registration; never edits source images or pixels."""
from pathlib import Path
import json,cv2,numpy as np
root=Path(__file__).resolve().parent
report=[]
for side in ['left','right']:
 source=cv2.imread(str(root/(side+'-input.png')),cv2.IMREAD_COLOR)
 generated=cv2.imread(str(root/(side+'-generated-mask.png')),cv2.IMREAD_UNCHANGED)
 scaled=cv2.resize(generated[:,:,:3],(320,880),interpolation=cv2.INTER_AREA)
 # Original pillar's opaque interior only; background/foreground features never register.
 roi=np.zeros((880,320),np.uint8)
 if side=='left':roi[130:670,80:245]=255
 else:roi[130:670,65:245]=255
 sift=cv2.SIFT_create(nfeatures=3000,contrastThreshold=.02,edgeThreshold=14)
 k1,d1=sift.detectAndCompute(cv2.cvtColor(source,cv2.COLOR_BGR2GRAY),roi)
 k2,d2=sift.detectAndCompute(cv2.cvtColor(scaled,cv2.COLOR_BGR2GRAY),None)
 matches=cv2.BFMatcher().knnMatch(d1,d2,k=2)
 good=[m for m,n in matches if m.distance<.72*n.distance]
 src=np.float32([k1[m.queryIdx].pt for m in good]);dst=np.float32([k2[m.trainIdx].pt for m in good])
 affine,inliers=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=3,maxIters=10000,confidence=.999)
 full,fullinliers=cv2.estimateAffine2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=3,maxIters=10000,confidence=.999)
 if affine is None:raise RuntimeError(f'Cannot register {side}: {len(good)} matches')
 errs=np.linalg.norm((np.c_[src,np.ones(len(src))]@affine.T)-dst,axis=1)
 active=errs[inliers[:,0]>0]
 row={'side':side,'originalCanvas':[320,880],'generatedCanvas':[generated.shape[1],generated.shape[0]],'sourceToNormalizedGenerated':affine.tolist(),'sourceToNormalizedGeneratedFullAffine':full.tolist(),'matches':len(good),'inliers':int(inliers.sum()),'residualMedianSourcePixels':float(np.median(active)),'residualP95SourcePixels':float(np.percentile(active,95)),'sourcePoints':src[inliers[:,0]>0].tolist(),'generatedPointsNormalized':dst[inliers[:,0]>0].tolist()}
 print(side,'matches',row['matches'],'inliers',row['inliers'],'affine',affine.tolist(),'median',row['residualMedianSourcePixels'],'p95',row['residualP95SourcePixels'])
 report.append(row)
(root/'registration.json').write_text(json.dumps(report,indent=2)+'\n')
