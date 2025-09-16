# NLL Refactor, Bayesian and Random Effects Design Doc

## 1. Introduction & Purpose {#1.-introduction-&-purpose}

FIMS architecture needs to be expanded to include State Space and Bayesian capabilities. This expansion requires a refactor of the architecture underlying the distribution components of the model that are summed to produce the negative log-likelihood (nll). In general, the proposed expansion will allow a generalized framework for time-varying parameters allowing for random effects, and the ability to include Bayesian priors on parameters.

This development will also structure the distribution functions so that it is straightforward for the user to select from a choice of distributions for a given dataset, random effect, or Bayesian prior. Development will allow for a library of probability distributions that can be used across FIMS. Each distribution will contain a method for calculating one-step-ahead residuals and a method for simulating from the distribution.

## 2. Architecture & Organization {#2.-architecture-&-organization}

Architectural changes will be grouped into four stages: . 1. The development of a hierarchical class structure for distributions (complete); 2. A generalized framework for adding random effects and Bayesian priors (complete); 3. Building up capacity which will add new distributions, osa residuals, and simulation functionality; and 4. Adding multivariate functionality for random effects and Bayesian priors.

[1. Introduction & Purpose](#1.-introduction-&-purpose)

[2. Architecture & Organization](#2.-architecture-&-organization)

[3. Decision Points](#3.-decision-points)

[4. Hierarchical Class Structure for Distributions](#4.-hierarchical-class-structure-for-distributions)

[5. A generalized framework for adding random effects and Bayesian priors](#5.-a-generalized-framework-for-adding-random-effects-and-bayesian-priors)

[6. Model Specification](#6.-model-specification)

[Negative Log Density Functions](#negative-log-density-functions)

[R User Interface](#r-user-interface)

[Rcpp](#rcpp)

[C++ Classes](#c++-classes)

## 3. Decision Points {#3.-decision-points}

-   Needs and Priorities
    -   Time variation (AR1, RW, 2d AR1, Ecov linkages, etc.)
        -   Generic framework on R side to specify on any parameter\
    -   Priors on parameters, flexible options w/ Jacobians\
    -   Library of likelihoods to pull from for indices, comps etc.\
    -   Need ability to compare and select best likelihoods from a set. Not always so simple b/c some likelihoods are not comparable e.g with AIC\
    -   Full state space capabilities\
    -   Bayesian capabilities
        -   Key steps are the ability to add priors and improved output/reporting.\
    -   OSA structure
        -   Flexible format for assembling the data vector going into osa component, needs to work as users add/remove data or even add "ghost" data.
            -   Choose bin to drop for multivariate constrained likelihoods (multinomial, D-M, Dirichlet, etc.)\
        -   \*Observations need to made random for osa.\
    -   Simulation\
    -   [Project board](https://github.com/orgs/NOAA-FIMS/projects/17/views/1)
        -   10 issues scoped out\
        -   11 in ToDo list\
    -   [FIMS requirements table](https://docs.google.com/spreadsheets/d/1impCdPPob8IPdoiFDpJpe7-Nbdjbz_Uq05_4BWooY4g/edit#gid=1133225771)
        -   33 issues scoped out\
        -   20 issues left for M2 but lots of overlap in issues\
-   [FIMS NLL Examples](https://docs.google.com/document/d/1X1NwjQlLrKGIXZgkMfJ29Kp1lFreKiiTTQxyoicgqxc/edit)
    -   User case studies helped guide proposed development tasks below:

## 4. Hierarchical Class Structure for Distributions {#4.-hierarchical-class-structure-for-distributions}

Build library of probability distributions and necessary architecture to connect to FIMS

-   UnivariateDistributionBase and MultivariateDistributionBase each with child Distribution classes (e.g. NormalLPDF, MultinomialLPMF, MvnormLPDF, etc.)
    -   LPDF: log probability density function (continuous distributions)\
    -   LPMF: log probability mass function (discrete distributions)\
    -   Base classes will have an evaluate function which takes input ***observed_value*** (can be data, parameters, or random effects) and ***expected_value*** (can be a derived value in the model, fixed or estimated)\
    -   Naming convention: prefer log PDF/PMF over "log-likelihood" as it is more generic. In a Bayesian context, a prior is conceptually different from a likelihood\
-   Each child Distribution class will have an evaluate function which takes local parameters and returns a log PDF/PMF.\
-   The child class evaluate functions will also includes code to calculate the OSA residual and simulation function available through TMB\
-   model.hpp is modified to loop over all instantiated Distribution classes and sum the negative values together to produce a joint negative log likelihood
    -   Note: When simulating from a model, simulation needs to happen in the order of model hierarchy (i.e. priors first, then random effects, then data).\
    -   Functions need to report out an nll value for each data point

## 5. A generalized framework for adding random effects and Bayesian priors {#5.-a-generalized-framework-for-adding-random-effects-and-bayesian-priors}

1.  Build infrastructure to include priors and random effects using a generalized framework\

-   Rcpp interface links user input with members of nll functions for the following three cases. The goal is to develop a generic interface that can handle all three cases:\

1.  Data Case: Rcpp interface links user input to ***observed_value*** in Distribution functions and points the ***expected_value*** to the correct derived value in the model. User sets initial values of parameters and Rcpp interface adds the parameters to the list of parameters estimated by the model\
2.  Prior Case: Rcpp interface links the ***observed_value*** in Distribution functions to a parameter/s in the model. User sets ***expected_value*** and Distribution specific parameters and fixes values so they are not estimated by the model\
3.  Random Case: Rcpp interface links the ***observed_value*** in Distribution functions to a process in the model and fixes the ***expected value*** at 0. User sets the initial value of Distribution specific parameters and these get added to the list of parameters estimated by the model
    -   Functions are designed to be generic to handle the following cases (see [FIMS NLL Examples](https://docs.google.com/document/d/1X1NwjQlLrKGIXZgkMfJ29Kp1lFreKiiTTQxyoicgqxc/edit))
        -   Scalar prior\

        -   Multivariate prior for multiple parameters within the same module (e.g. Multivariate prior on Linf and K\

        -   Univariate random effect\

        -   Multivariate random effect for a single process (e.g. log_M across years and ages)\

        -   \*Multivariate prior for two parameters across different modules - doesn't need to be constrained to two (e.g. mortality and steepness)\

        -   \*\*Multivariate random effect for two processes within the same module\

        -   \*\*Multivariate random effect for two processes across different modules

            \*low priority (\*\*would require research)\
            3. Discussion Points

-   One class per distribution with flags for osa and simulation flags for data and re/priors\
-   wrt simulations, order matters and needs to follow the natural hierarchy of the model (i.e. 1. Priors 2. Random effects 3. Data )\
-   Interface - generic approach but be mindful of different use cases
    -   Multivariate where each parameter/process comes from a different module\
    -   Varying data types (i.e. scalar sd vs vector of cvs for dnorm)\
-   From WHAM: 2dAR1 with recruitment and NAA - these should **not** be linked; solution was to apply 2dAR1 to ages 2+ and recruitment treated differently - consider if NAA should be an additional module on top of recruitment
    -   What complexities occur with NAA (random effect, movement) - if more than two use cases then justification to create new module\
-   OSA requires a lot of input code on the R side to prepare for OSA wrt multinomial
    -   Need to throw out one of the age/year bins - need to set NA so the osa calculation skips this value ([WHAM approach](https://github.com/timjmiller/wham/blob/master/R/set_osa_obs.R#L280))\
    -   Is this something we develop during M2?\
    -   What does SAM do?\
    -   Can this be done internally in C++?\
-   Need to be mindful of sparsity - e.g. Recruitment with an AR1 process is dense if the random effect is the devs but is sparse if the random effect is logR.

4\. Proposed Tests:

-   RE test\
-   tmbstan test\
-   MLE test with penalties

## 6. Model Specification {#6.-model-specification}

Ideas are being explored using the [ModularTMBExample](https://github.com/NOAA-FIMS/ModularTMBExample/tree/FIMS-v0100-nll-refactor-2)

### Negative Log Density Functions {#negative-log-density-functions}

UnivariateBase

-   \*Normal(x, mu, sd) **completed**\
-   \*LogNormal: often written as Normal(log(x), mu, sd) - log(x) **completed**\
-   \*\*Gamma(x, 1/cv\^2, cv\^2\*mean), cv: coefficient of variation, mean \> 0, typically use a exp() to keep the mean positive\
-   \*\*\*NegativeBinomial: used for tagging data - parameterization can be a bit tricky, research best one to use for tagging data; discrete data\
-   \*\*\*Tweedie(x, mean, disp, power), mean \>0 (typically exp()), disp \> 0 (typically exp()), 1 \< power \< 2 (scaled logit transformed); used for zero-inflated continuous data (hurdle data)

MultivariateBase

-   \*Multinomial **completed**
    -   If calculating OSA residual, data need to be true counts\
-   \*\*Dirichlet Multinomial\
-   \*\*Logistic Normal - performs better than DM at large sample sizes and DM performs better than LN at small sample sizes
    -   Relies on the multivariate normal (e.g., [here](https://github.com/timjmiller/wham/blob/master/src/age_comp_osa.hpp#L271))\
    -   Will work better with OSA compared to multinomial - often comp data are not true integers\
-   \*\*\*Multivariate Tweedie\
-   \*AR1\
-   \*\*Multivariate Normal - required to implement the Logistic Normal\
-   \*\*2dAR1\
-   \*\*\*GMRF

\*Highest priority\
\*\*Mid priority\
\*\*\*Low priority

### R User Interface {#r-user-interface}

**Generic SetNLL()**

**Case: Univariate Prior (e.g. Normal prior on M)**\
\> logM_nll \<- new(NormalNLL)\
\> logM_nll$type \<- prior (choices are random\_effect, prior, or data) \> logM\_nll$mu$value \<- log(0.2) \> logM\_nll$mu$is\_estimated \<- FALSE \> logM\_nll$log_sd \<- log(0.1)\
\> logM_nll$sd$is_estimated \<- FALSE\
\> SetNLL(module = 'population', module_id = population\$get_id(),\
member_name = log_M, nll = logM_nll)

Alternate approach or higher level helper function:\
population$SetPriors(pars \= ‘log\_M’, mu \= log(0.2), sigma \= 0.1,  family \= ‘normal’, log \= FALSE) SetPriors(module \= ‘population’, module\_id \= population$get_id(),\
pars = 'log_M', mu = log(0.2), sigma = 0.1,\
family = 'normal', log = FALSE){\
new_nll \<- lookup_function(#looks up family and returns new() based on NLL call from\
family argument\
new_nll$type \<- ‘prior’  new\_nll$mu$value \<- mu  new\_nll$mu$is\_estimated \<- FALSE  new\_nll$log_sd \<- log(sigma)\
new_nll$sd$is_estimated \<- FALLSE\
new_nll$module\_name \<- module  new\_nll$module_id \<- module_id\
new_nll\$member_name \<- pars\
}

**Case: Univariate Random Effect**\
#AR1 random effect\
\> logitSteep_nll \<- new(AR1NLL)\
\> logitSteep_nll$type \<- random\_effect\> logitSteep\_nll$logit_phi$value \<- 0 \> logitSteep\_nll$logit_phi$is\_estimated \<- TRUE \> logitSteep\_nll$log_var$value \<- 1 \> logitSteep\_nll$log_var\$is_estimated \<- FALSE

\> recruitment \<- new(BevertonHolt)\
\> SetNLL(recruitment, logit_steep, logitSteep_nll)

#or recruitment itself can be a random effect\
\> recruitment \<- new(AR1NLL)

**Case: Multivariate Prior - Single Parameter**\
\# 2dAR1 on M, multivariate dimensions match parameter dimensions\
\>logM_nll \<- new(2dAR1NLL)\
\>logM_nll$type \<- ‘random\_effect’ \>logM\_nll$logit_phi1 \<- 1\
\>logM_nll$logit\_phi2 \<- 0 \>logM\_nll$log_var \<- 0\
\>logM_nll$logit\_phi1$is_estimated \<- FALSE\
\>logM_nll$logit\_phi2$is_estimated \<- TRUE\
\>logM_nll$log\_var$is_estimated \<- TRUE

\> population \<- new(Population)\
\> SetNLL(population, logM, logM_nll) - or - population\$SetNLL(logM, logM_nll)

**Case: Multivariate Prior - Multiple Parameters**\
library(FishLife)\
library(mvtnorm)\
params \<- matrix(c('Loo', 'K'), ncol=2)\
x \<- Search_species(Genus="Hippoglossoides")$match\_taxonomy y \<- Plot\_taxa(x, params=params) \#\# multivariate normal in log space for two growth parameters mu \<- y\[\[1\]\]$Mean_pred$$params$$\
Sigma \<- y$$\[1$$]$Cov\_pred\[params, params\] \#\# log density in R dmvnorm(x=c(3,-2), mean=mu, sigma=Sigma, log=TRUE) \>growth\_nll \<- new(MVnormMLL) \>growth\_nll$type \<- 'prior'\
\>growth_nll$mean \<- mu \>growth\_nll$Cov \<- Sigma\
\>growth_nll$mean$is_estimated \<- FALSE\
\>growth_nll$Cov$is_estimated \<- FALSE

\>growth \<- new(EWAA)\
\> SetNLL(list(growth), list(L_inf, K), growth_nll)

**Case: Multivariate Random Effect - Different Modules**

**Case: Data**\
catch_nll \<- new(LognormalNLL)\
catch_nll\$log_sd \<- cv_vector\
catch_at_age_nll \<- new(MultinomialNLL)

SetNLL(fleet, catch, catch_nll)\
SetNLL(fleet, catch_at_age, catch_at_age_nll)

### Rcpp {#rcpp}

//Cases:\
single module, x is scalar\
single module, x is vector\
single module, x is matrix\
multiple modules, x is vector\
multiple modules, x is matrix

SetNLL(module_id, x, nll){\
module$$module\_id$$ -\> name_same_as(x) = x\
nll -\> x = module$$module\_id$$ -\> name_same_as(x)\
}

SetMVNLL(list(m1id, m2id), )

### C++ Classes {#c++-classes}

UnivariateBase

-   Observed_value:

    -   Data: input by the user\
    -   Random effect: calculated within a module\
    -   Prior: set to a parameter in the model\
    -   Needs to be able to handle both scalar and vector\

-   expected_value:

    -   Data: calculated within population\
    -   Random effect: fixed at zero\
    -   Prior: set and fixed by the user\

-   evaluate(observed_value, expected_value, do_log = true)

    NormalPDF

-   sd: initiated through user interface\

-   osa_flag: if data, implements the osa calculate\

-   simulation_flag\

-   evaluate()

    -   Loop over the length of observed_value and evaluate the nll for dnorm\
    -   Calculate osa residuals\
    -   Need to implement the cdf method for all distributions?

Notes

-   NLL-Population linkage unclear
    -   Setting random effect or prior on parameters that are already in population will be somewhat straightforward\
    -   Setting random effects/priors on values in population that are set up as derived quantities are less clear. For example, does NAA need to become its own module? [This calculation](https://github.com/NOAA-FIMS/FIMS/blob/18f96a81d02021a55c9f91a66485e7250a20cb5a/inst/include/population_dynamics/population/population.hpp#L240) gets confusing if NAA is an AR1 or 2dAR1.
