---
title: 'Input Setting of Deep Learning based HDR'
pubDate: 2023-02-01
author: 'Junda Liao'
tags: ['High Dynamic Range']
description: 'According to the optical flow computed on different kinds of input images, different exposure alignment strategy may influence the network to find correct correspondence between reference and non-reference images. Besides, deformable convolution can also be regarded as a kind of attention mechanism. Except for aligning features, it may also have the ability of extracting important information for HDR content fusion. So input LDR image features may make the result different.'
---

## Purpose

Generate ghost-free HDR images from bracketed exposures.

## Key Elements

### HDR synthesis equation

#### Overview

- Produce an HDR image that coherently uses all the content (draw information from all the input images) in the input images while being aligned to one of them.
- **Patch-based energy minimization** formulation that integrates alignment and reconstruction in a joint optimization.

#### Key Idea

- Alignment will be easier with the information from the final HDR result.
  - The exposures often overlap considerably in the radiance domain.
  - Information from one aligned image can be propagated to another.
- HDR reconstruction as an optimization
  - The optimal solution matches a reference image in the well-exposed regions.
  - In poorly-exposed regions of the reference image, the optimal solution is locally similar to the other LDR sources, containing as much information from them as possible.

#### Details

##### Desired properties of the HDR result

- The $l^{ref}(H)$ should be very close to $L_{ref}$, and the $h(L_{ref})$ should be similar to $H$ where it is properly exposed.

  - Make $H$ looks like $L_{ref}$ so that it appears to be taken by a real camera and does not have unrealistic artifacts.
  - Preserve information from well-exposed pixels of $L_{ref}$ as much as possible.

- For the poorly-exposed pixels, $H$ should include information from all other exposures.
  - $H$ should be similar to any input source when mapped through the response curve of the $k^{th}$ exposure (i.e. $l^k(H)$ ).

##### Equation

$$
E(H) = \sum_{p \in pixels} [\alpha_{ref}(H(p) - h(L_{ref})(p))^2 + (1 - \alpha_{ref})  E_{MBDS}(H|L1, L2, \dots, L_N)]
$$

- $\alpha_{ref}$ : trapezoid function indicating how well a pixel is exposed. $H$ : HDR result. $h$ : the function map LDR image to the linear domain. $L$ : LDR images.
- The first term ensures H at a given exposure is similar to the reference image in well-exposed regions.
- The second term constrains the remaining poorly-exposed pixels to match the other LDR sources.

Multi-source bidirectional similarity measure (MBDS)

$$
E_{MDBS}(H|L1, L2, \dots, L_N) = \sum_{k=1}^N \mathrm{MBDS}(l^k(H)|g^k(L_1), g^k(L_2), \dots, g^k(L_N))
$$

- Try to keep H at a each exposure as similar as possible to all the input sources adjusted to that exposure.
- Coherence: for each patches in the $l^k(H)$, there is a comparable patch in one of the exposure adjusted images.
- Completeness: for each valid patches in the exposure adjusted images, there is a comparamble patch in the $l^k(H)$

##### Optimization

$$
\begin{split}
E_{MDBS}(H, I_1, I_2, \dots, I_N|L1, L2, \dots, L_N) = \\
\sum_{k=1}^N \mathrm{MBDS}(I_k|g^k(L_1), g^k(L_2), \dots, g^k(L_N)) + \\ \sum_{k=1}^N\sum_{p \in pixels} \Lambda(I_k(p))(h(I_k)(p) - H(p))^2
\end{split}
$$

- Directly optimizing $H$ at n exposures is difficult, so auxiliary variable $I_k$ is used for $l^k(H)$
- $\Lambda(\cdot)$ is the triangle weighting function used in traditional HDR imaging.
  - It gives more weight to the values of $I_k$ that contribute more to the result.

The two stages of the optimization

1. Optimize for $I_1, I_2, \dots, I_N$ by o ptimizing $E_{MDBS}$
   1. $I_k \leftarrow \mathrm{SearchVote}(I_k, g^k(L_1), g^k(L_2), \dots, g^k(L_N))$
   2. $I_k \leftarrow \mathrm{Blend}(I_k, l^k(H))$
2. Optimize for $H$
   1. $\tilde{H} \leftarrow \mathrm{HDRMerge}(I_1, I_2, \dots, I_N)$
   2. $\mathrm{AlphaBlend}(h(L_{ref}), \tilde{H})$

# Exposure Fusion

## Purpose

Fuse a bracketed exposure sequence into a high quality low dynamic range image, without converting to HDR first.

## Key Elements

- Exposure fusion algorithm
  - Assumption: input images are perfectly aligned.
  - Basic idea: only keep the "best "parts in the multi-exposure image sequence.
  - Weight map: compute a set of quality measures to calculate the weight for each pixel.
    - Contrast: Laplacian filter; assign a high weight to important elements (e.g. edges, texture).
    - Saturation: standard deviation within the RGB channel at each pixel; saturated color are vivid.
    - Well-exposedness: keep intensities that are not near zero or one; $\exp(-\frac{ (i- 0.5)^2}{2\sigma^2})$
    - Weight for each pixel at $ij$: $W_{ij,k} = (C_{ij,k})^{\omega_C} \times (S_{ij,k})^{\omega_S} \times (E_{ij,k})^{\omega_E}$
  - Fuse the weight maps and the LDR images with a Laplacian pyramid
    - Seams appear: weights vary quickly + images contain different absolute intensities due to their different exposure time
    - Laplacian pyramid: blend features instead of intensities, which is effective to avoid seams.
      - In Laplacian pyramid, sharp transitions in the weight map can only effect sharp transitions appear in the original images (high frequency component, e.g. edges), while flat regions will always have negligible coefficient magnitude, so they are hard to be affected by the sharp transition in the weight maps.
  - Advantages and disadvantages
    - Simplified pipeline: no in-between HDR image needs to be computed; no need to compute CRF curve;
    - Can be computed at near-interactive rates.
    - It cannot obtain high dynamic range image.

## Useful Ideas

- The logic of considering how to apply weight maps on images.
  1. Naive weighted sum: a lot of seams artifacts appear.
  2. Observed that this is caused by sharp transition in weight maps.
  3. Try to smooth the weight map to reduce the influence of sharp transitions with Gaussian filter and cross-bilateral filter, but find the result is still not so satisfactory.
  4. Get hints from "Laplacian Pyramid for Image Code" and utilized Laplacian pyramid to do the fusion.
- Laplacian Pyramid
  - Steps:
    - L1 = I1 - blur(I1); I2 = down_sample(I1)
    - L2 = I2 - blur(I2); I3 = down_sample(I2)
    - L3 = I3 - blur(I3); L4 = down_sample(I3)
  - Retain residuals (details) between pyramid levels

# SPyNet

CVPR 2017

## Logic

- Try to compute optical flows combining a classical pyramid formalation with deep learning.
- Basic logic
  1. Most optical flow methods are derived from some classical formalations that make a variety of assumptions.
  2. A recent optical flow methods (FlowNet) abandon these classical formulations altogether and starts over to use a network to directly compute optical flow by inputting a pair of images. But it cannot obtain the state-of-the-art results compared with classical methods.
  3. The authors propose to use deep learning to attack the weak points (e.g. the assumptions that limit their performance) of classical approaches.
  4. The authors describe two problems for computing optical flow:
     1. Establish long-range correlations (caused by large motions?) between images or pixels.
     2. Compute the detailed sub-pixel optical flow and precise motion boundaries.
  5. The authors propose to use deep learning to deal with the latter problem, and use the engineered structure of a traditional approach (i.e. spatial pyramid) to deal with the former problem.
  6. Although some problems inherited from traditional approaches are still unresolved, they get quite a good result.
- Key idea: combine classical structure spatial pyramid with deep learning to compute optical flow.

## Framework

### Key points

- Learn residual flow at each pyramid level.
- CNN at each level only has to estimate a small motion update.

### Advantages

- Spatial pyramid handles large motions.
- Suitable for CNN to learn since flow update at each level if small.
- Provide insight to understand the networks by looking at the convolution kernels.

### Details

![framework](images/spynet-framework.png)

About Training

![training](images/spynet-training.png)

## Useful Elements

- The idea to combine engineered structure of classical approaches and deep learning. They use deep learning to attack the weak points of classical approaches.
  - It is worth to reading classical methods and obtain ideas for designing networks.
- Spatial pyramid: network at each level only learns a small update based on the result of last level.

# RDN for Image Restoration

CVPR 2018 & TAMPI 2020

## Logic

Basic Logic

1. As the network depth grows, features in each convolution layers would be **hierarchical with different receptive fields.**
2. Most image restoration models do not fully utilize hierarchical features. **(Main problem)**
   - Hierarchical features in a very deep network could give more clues for reconstruction, but many models neglect to use them.
3. The authors also noticed that a previous work introduced dense block for image SR. But too many dense blocks would make the network hard to train.
4. To fully utilize hierarchical features (information from every convolution layers), the authors proposed RDB and GFF (global feature fusion).
5. RDB is proposed to fully utilize the features from all the layers within it via local dense connections.
6. DFF is proposed to fuse hierarchical features generated by RDBs, and combine shallow features and deep features with a skip connection (global residual learning).

## Key Elements

### The Details of Logic

#### Residual Dense Block (RDB)

1. To fully use hierarchical features (in a relatively local way), RDB is proposed.
2. Dense connections (among previous RDB output and layers within current RDB) provide RDB with continguous memory mechansim, which aims at fusing information from all the convolution layers as much as possible.
3. Local feature fusion provide RDB with fewer output features which makes it easier to train. (It can also be understand as adaptively control output information).
4. Local residual learning improves the information flow of RDB.

#### Dense Feature Fusion (DFF)

1. The target is to adaptively fuse the features from previous RDBs, which eploit hierarchical features in a global way.
2. Global feature fusion extract global features by fusing all the features from previous RDBs.
3. Global residual learning is used to learn the feature-maps before upsampling.

### Framework

#### Whole Framework

![framework](images/rdn-framework.png)

#### Residual Dense Block

![RDB](images/rdb.png)

## Useful Elements

- Importance of utilizing hierarchical information for image restoration tasks.
- The idea of connecting shallow features with deep features at the end of the network.

# HDR-NeRF

## Logic

The target is to recover an HDR radiance field from a set of LDR images with different exposures.

Basic logic is as below:

1. Limited by the dynamic range of camera sensors, rendered novel views by NeRF are often with low dynamic range. (Main problem)
2. The authors propose to render novel HDR views with NeRF to improve the visual experiences.
3. After reviewing current HDR works, the authors find that current HDR imaging methods are unable to render novel views, and some methods combine HDR techniques with image-based rendering struggle from preserving view consistency.
4. Based on NeRF, the key idea of the authors is to model the image acquisition pipeline with tone-mappers. The tone-mapper models the process that the radiance in a scene becomes pixel values in an image (i.e. camera response function). After obtaining the output of the radiance field, the tonemapper will compute the final color values according to this output and the exposure time.
5. The authors propose to use three independent MLP to learn three tonemappers for differnt channels.
6. To train this NeRF model, the authors collect a new HDR dataset that contains synthetic scenes and real-world scenes.
7. By inputting LDR images with three different exposures to the proposed HDR-NeRF model and using the LDR images with another two different exposures as supervision, the authors successfully build a high quality a NeRF model that is able to render HDR novel views.

## Key Elements

### The Details of Proposals

1. An HDR radiance Field will output raidance and density according to the input ray's information (i.e. spatial location and direction).
2. The radiance and exposure time are translated into logarithmic domain. Then they will be added to form the input of the tonemapper.
3. The tonemapper is used to learn the CRF in logarithmic domain (the same manner as Debevec).
4. After obtaining the color information output by tonemapper and the density output by radiance field, the volume redering is applied to generate an LDR image.
5. MSE loss between the ground truth color and the generated color is the optimization target.
6. One more loss for controlling the scale factor of the recovered radiance is added to the optimization target. (The same as Debevec)

### Framework

![hdr nerf](images/hdr-nerf.png)

## Useful Elements

- Combine traditional HDR methods with NeRF to construct the HDR NeRF.
- We can learn from this work about how to build a novel framework
