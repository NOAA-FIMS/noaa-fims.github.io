# Design Document and Requirements for Surplus Production Model in FIMS

Surplus production models (SPM) are used by many data-moderate populations for management. **The goal is to be able to use FIMS to run an SPM using the same data input structure as a statistical catch-at-age FIMS model (FIMSframe) and a new SPM module, to produce estimates of biomass, harvest rate, and management reference points.** Current best practice recommendations for SPMs ([Kokkalis et al. 2024](https://www.sciencedirect.com/science/article/pii/S0165783624000742#:~:text=The%20generalised%20SPM%20includes%20a,rate%20and%20F%20is%20the)) include the use of

1. state-space models (e.g., [SPiCT](https://github.com/DTUAqua/spict) and [JABBA](https://github.com/jabbamodel/JABBA/tree/master))  
2. Bayesian frameworks or penalized likelihood with priors for MLE   
3. no priors on stock-specific model parameters (carrying capacity and maximum sustainable yield) when fitting data to an SPM using MLE  
4. uninformative priors when fitting data to an SPM using Bayesian methods  
5. convergence checks, residuals, prior-posterior distribution comparisons, retrospective analysis, hindcasting analysis (sequentially removing data and testing the model’s predictive ability for removed data), and jitter analysis as diagnostics  
6. stochastic reference points that include correction factors that depend on estimated error from biomass process when shape parameter is \> 1 (if m \< 1, use deterministic reference points)

SPMs combine all aspects of a population’s growth, recruitment, and mortality into one production function and assume that the effect is the same on all parts of the modeled population. This is a major difference between SPMs and statistical-catch-at-age models, which separate population dynamic relationships and age-classes. Note, because there is no age- or size-specific information, there are no age- or size-dependent processes in the model and the portion of the population that is being modeled is the portion that is reflected by the indices of abundance. SPMs strive to describe the population dynamics over time based on the stock’s response to fishing pressure (reflected in the index of abundance or catch per unit effort, CPUE, trends) and the historical catches, which provide an indication of the scale of the population.

# Equations 

The goal is to estimate the unobserved quantity of the total population biomass for a given year. To do this, we rely on observed fishery catch data and indices of abundance, such as catch-per-unit-effort from a fishery or a relative index of abundance from a fishery-independent survey. There is a strong assumption that the indices of abundance provide a good idea of how the population responds to fishing pressure over time so the trend of the indices should represent the trend of the population’s biomass over time. While indices of abundance inform the trend of the population over time, catch data informs the scale of the population. In a surplus production model, the total population biomass in year *t* is calculated by:
$$
\begin{align}   
\nonumber B_{0} &= B_{init},\quad t = 0  \\
\nonumber B_{t+1} &= B_{t} + rB_{t}(1-\frac{B_{t}}{K})-C_{t},\quad t = 1…T     
\end{align}
$$
where $t$ \= year, $B$ \= biomass, $B_{init}$ \= initial biomass, $K$ \= carrying capacity, $r$ \= intrinsic growth rate of the population, and $C$ \= catch. Biomass in year $t+1$ is dependent on biomass in year $t$, the amount of production (recruitment, growth, and death) in year $t$, and catch in year $t$. If data is available from the assumed start of the fishery, $B_{init} = K$, otherwise, initial biomass can be estimated based on initial depletion ($\psi$): 
$$  
B_{init} = K\psi
$$
To estimate the unobserved quantity of biomass, we can fit the model to the indices of abundance. Based on the assumptions of the model, biomass is related to the indices of abundance by a catchability, $q$, parameter:   
$$
\hat{I}_{t,f} = \frac{C_{t,f}}{E_{t,f}} = q_{f}B_{t}  
$$
where $\hat{I}_{t,f}$, is the predicted index of abundance in year $t$ for fleet $f$, and $q_{f}$ is the catchability coefficient (the amount of biomass or catch taken/one unit of effort) for fleet $f$. It is assumed that the index of abundance is a good representation of the population’s trend and response to fishing pressure over the timeseries. Therefore, the model tries to minimize the difference between the observed index values ($I_{t,f}$) and the predicted index values ($\hat{I}_{t,f}$) by finding the values for $B_{t}$ and $q_{f}$ that best fit the observed index values.   
The production function (represented by $rB_{t}(1-B_{t}K$) in the biomass equation) can be parameterized in several ways. 

### Schaefer model 
$
f(B_{t}) = rB_{t}(1-\frac{B_{t}}{K})
$
### Fox model
$
f(B_{t}) = log(K)rB_{t}(1-\frac{log(B_{t})}{log(K)})
$
### **Pella-Tomlinson model**
$
f(B_{t}) = \frac{r}{m-1}B_{t}(1-(\frac{B_{t}}{K})^{m-1})  
$

where $m$ is the shape parameter that determines the $B/K$ ratio where maximum surplus production is attained at. If $m = 2$, the model reduces down to the Schaefer model, if $m \approx 1$, the model reduces to the Fox model but there is no exact solution if $m = 1$. **We decided to use the Pella-Tomlinson implementation of the production function because it is the most flexible model, the shape parameter at 2 will give a Schaefer model and at 1 will give the Fox.**

### State-space formulation

State-space models are a type of hierarchical model that allows the natural variability in the environment (process error, 2\) to be modeled separately from the error associated with observed data (observation error, $\sigma^{2}$). To help with computational estimation, the model can be re-written in terms of depletion, $P_{t}$,  where $P_{t} = B_{t}K$ is an unobserved state. A Bayesian state-space formulation (Meyer and Millar, 1999) can be written as:  
$$
\begin{align}
\nonumber P_{0} &= \psi, \quad t = 0\\  
\nonumber P_{t+1} &= P_{t}+\frac{r}{m-1}P_{t}(1-P_{t}^{m-1}) - \frac{C_{t}}{K}, \quad   t=1,...T \\ 
\nonumber P_{t} | P_{t}, \sigma^{2} &\sim lognormal(ln(P_{t}), \sigma_{t}^{2}), \quad   t=0,....T  
\end{align}
$$

and the depletion is then fit to index of abundance assuming a lognormal distribution:
$$ 
I_{t,f}| P_{t},K,q_{f},\sigma^{2} \sim lognormal(ln[q_{f}P_{t}K], \tau^{2}) \quad  t=1,...T  
$$
where $\psi$ is initial depletion (can be assumed to be 1 or estimated), and depletion in year $t$ ($P_{t}$) is log-normally distributed with a mean of $ln(P_{t})$ and log-normal process error variance ($\sigma^{2}$) and the expected index of abundance value is lognormally distributed with a mean of $ln[q_{f}P_{t}K]$ and log-normal observation variance of $\tau^{2}$. Annual biomass can then be calculated as:   
$$
B_{t}= P_{t}K
$$


### Derived Quantities and Reference Points

Annual harvest rate ($H_{t}$) is calculated by:   
$
H_{t} = \frac{C_{t}}{B_{t}}  
$
A penalty should be added to ensure that harvest rate does not go above 1.0, because while this may be possible mathematically, it is not possible biologically (cannot have more catch than biomass in a given year).   
In the Pella-Tomlinson parameterization, the shape parameter, $m$ can be directly linked to biomass at maximum sustainable yield, $B_{MSY}$, by the ratio of $\frac{B_{MSY}}{K}$ by:

$  
\frac{B_{MSY}}{K} = m^{\frac{-1}{m-1}},  
$

therefore $B_{MSY}$ can be calculated as:

$  
B_{MSY} = Km^{\frac{-1}{m-1}}.  
$

The fishing mortality at maximum sustainable yield (MSY) can be calculated as:  

$
F_{MSY}=\frac{r}{m-1}(1-\frac{1}{m}).  
$

And MSY is given as: 

$  
MSY=F_{MSY}B_{MSY}
$

# Input Requirements

### Data

* Time series of catch (as complete as possible)   
* Time series of index of relative abundance (fishery-independent or CPUE) with measure of uncertainty (annual CVs)

### Parameters

In a Bayesian framework, priors for all parameters are needed. Basic parameters and their related attributes are given in the following table: 

| Name | Description  | Distribution | Indexed by |
| :---: | :---- | :---- | :---: |
| r | Intrinsic population growth rate | Lognormal | run |
| K | Population carrying capacity | Lognormal | run |
| m | Pella-Tomlinson shape | Lognormal | run |
|  | Initial depletion | Lognormal or Beta | run |
| q | Catchability | Lognormal | fleet |
|  | Process error | Inverse gamma | year |
|  | Observation error | Inverse gamma | fleet and year |

Note: Here is a running [list of parameters](https://docs.google.com/spreadsheets/d/1SnlXcfL90w6lEbPx1eRVRBXAEP3_97tzE1Oa_n2ivpM/edit?gid=2063265688#gid=2063265688) (names and abbreviations) that are currently in FIMS. Naming conventions and names are currently being discussed and will be modified after M2.

### Model Setup 

To run in a Bayesian framework, users will also need to specify some settings for the Markov Chain Monte Carlo (MCMC) sampling including: 

* Number of chains  
* Number of cores (for parallel processing)  
* Number of iterations  
* Number of burn-in (draws thrown away from the beginning of each chain)  
* Thinning (rate at which sample draws are kept in the output, e.g., 10, keep every 10th draw)  
* Seed (to ensure reproducibility)

All sampling functionality will be done using `tmbstan()` or some other sampling function from a separate R package. 

# SPM modules added to code base

The code for running an SPM will be added into surplus\_production\_model.hpp and include the following method calls. 

```c

  // Sample the distributions. (N.B. The sampling will most
  // likely be elsewhere.)
  sampleDistributions(
      num_years, num_fleets,
      sample_r, sample_K, sample_m, sample_psi, sample_q,
      process_error_sigma, observation_error_tau);

  // Calculate the depletion vector
  calculateDepletionP(
      num_years, obs_catch, sample_r,
      sample_K, sample_m, sample_psi,
      process_error_sigma, depletion_P);

  // Calculated the expected abundance and then minimize 
  // for the estimated parameters
  calculateExpectedAbundance(
      num_years, num_fleets, depletion_P, abundance_observed_I,
      sample_r, sample_K, sample_m, sample_psi, sample_q,
      process_error_sigma, observation_error_tau, abundance_expected_I);

  // Calculate minimum estimated parameters for 
  // number of years and fleets. (N.B. This will be done in
  // nlimb() or in tmbStan.)
  calculateEstimatedParameters(
num_years, num_fleets,
       abundance_observed_I, abundance_expected_I,
       sample_r, sample_K, sample_m, sample_psi, sample_q,
       process_error_sigma, observation_error_tau,
       estimated_r, estimated_K, estimated_m, estimated_psi,
       estimated_q, estimated_sigma, estimated_tau);

TODO: The following 3 modules need to work on every draw.

  // Calculate F(MSY) and B(MSY)
  calculateReferencePoints(
       final_r, final_K, final_m, FMSY,BMSY,MSY);

  // Convert depletion P to biomass B
  calculateExpectedBiomass(
       num_years, final_K, depletion_P, biomass_expected_B);

  // Calculate harvest rate H
  calculateHarvestRate(
       num_years, obs_catch, biomass_expected_B, harvest_rate_H);

```

# Proposed wrapper functions for running an SPM with FIMS

We propose to create wrapper functions (currently being implemented by FIMS Wrapper Function group for SCAA) that the user can call to build and fit a surplus production model.

```py
Proposed FIMS SPM usage (similar to JABBA):

/*
   User knows what’s required (and appropriate units/scale) by running:   ?FIMS::build_spm
   ?FIMS::fit_spm*/

// Define inputs here
fishery_catch = …
fishing_fleet_indices = …
survey_fleet_indices = …
…
initial_values_[1..num_chains] <- list(
    population_growth_r,
    carrying_capacity_K,
    shape_m,
    initial_depletion_psi,
    catchability_q,
    observation_error_tau,
    process_error_sigma)

initial_values_full <- list(
    initial_values_1,
    initial_values_2,
    …
    initial_values_[num_chains])

prior_distributions <- list(
    population_growth_r,
    carrying_capacity_K, 
    shape_m,
    initial_depletion_psi,
    catchability_q,
    observation_error_tau,
    process_error_sigma)
mcmc_settings <- list(
    number_chains,
    number_cores,
    number_iterations,
    length_burn_in,
    thinning_rate,
    seed)

// Combine fishing and survey fleet data in the same tables.
// Formatted as FIMSframe with, for example, first column “Fleet” 
// denoting “Fishing” or “Survey”.
indices_of_abundance:
    fishing_fleet_indices = …,
    survey_fleet_indices = …,

//
//
// Build the SPM object from the previously defined inputs
//
//
spm_object = FIMS::build_spm(
    catch = fishery_catch,
    indices_of_abundance = indices_of_abundance,
    initial_values = initial_values,
    prior_distributions = prior_distributions)
    
//
//
// Run the model
//
//
spm_output = FIMS::fit_spm(
    spm_object = spm_object,
    optimization = BAYESIAN | MLE,
    markov_chain_monte_carlo = mcmc_settings)
    

// Output structure:
spmOutput$estimates
spmOutput$fits  


```

## Running an SPM 

Based on the current [GOA Pollock case study](https://github.com/NOAA-FIMS/case-studies/blob/3e8f058d636ccc1737e17a063e7df4ec03c8106e/content/AFSC-GOA-pollock.qmd#L229), running a FIMS model with `tmbstan()` can be done as follows. Note that code for implementing priors is under development and can be added once it is complete.

```
parameters <- list(p = get_fixed())
map <- parameters
obj3 <- MakeADFun(data = list(), parameters, DLL = "FIMS", silent=TRUE, map=map)
fit <- tmbstan(obj3, chains=1, cores=1, open_progress=FALSE,
               init='last.par.best', control=list(max_treedepth=10))

```

# Outputs

The current output of FIMS is a JSON file with all parameter estimates. The R interface group is currently working on writing R code to take the output and separate it into 2 “tibbles”, one with “estimates” and one with “fits” (R code can be written later so no need to focus too much on that now). SPM output should follow the same format, making sure to include all information that would be needed. Expected outputs from an SPM would include: 

* “Estimates” tibble:   
  * Posterior distributions of annual biomass and harvest rate  
  * Posterior distributions of all parameters   
  * Posterior distributions of reference points   
* “Fits” tibble:   
  * Expected values for CPUE/indices of abundance 

Additional information to include with the values for bookkeeping would include: 

* Time  
* Prior (for MLE format we use initial value)  
* Label (for estimates, e.g. b, f, etc.)  
* Unit   
* Distribution   
* Type  
* Name (for fits, e.g. “survey1”)

FIMS uses tables in a “long” format, so for each parameter (or year of a timeseries), there would be the same number of rows as draws that were saved in the output. For example, if a user ran a model with the following settings: 

* 3 chains  
* 1,000 burn-in (or sometimes called warmup)  
* 10,000 iterations  
* 10 thinning interval

((10,000-1,000)/10)\*3 \= 2,700,  
they would have a total of 2,700 draws. An example of what the output table would look like is: 

| Label | Time | Initial  | Estimate  | … (additional columns) |
| :---- | :---- | :---- | :---- | :---- |
| biomass | 2000 | NA | 12000 |  |
| biomass | 2000 | NA | 12002 |  |
| …row 2,700 | 2000 | NA | 12010 |  |
| biomass | 2001 | NA | 11800 |  |
| biomass | 2001 | NA | 11950 |  |
| …row 5,400 | 2001 | NA | 11865 |  |

# Comparison of requirements for models along the continuum

|  | SPM | Delay Difference | ASPM | SCAA |
| :---- | ----- | ----- | ----- | ----- |
| **Data Inputs** |  |  |  |  |
| Catch  | X | X | X | X |
| Index of   Abundance/CPUE | X | X | X | X |
| Length Comp |  |  |  | X |
| Age Comp |  |  |  | X |
| **Parameters** |  |  |  |  |
| Catchability, q | X | X | X | X |
| Observation   error | X | X | X | X |
| Natural   Mortality, M  |  | X | X | X |
| Growth |  | X | X | X |
| Weight-at-Age |  | X | X | X |
| Steepness |  | X | X | X |
| Initial   Recruitment, R0   |  | X   | X | X   |
| Initial   depletion | X |  | X | X |
| Maturity |  |  | X | X |
| Max age |  |  | X | X |
| Selectivity |  |  | X | X |
| Process error | X |  |  | X |
| Intrinsic growth   rate, r | X |  |  |  |
| Carrying   capacity, K | X |  |  |  |
| Shape, m | X |  |  |  |
| Proportion   Female |  |  |  | X |
