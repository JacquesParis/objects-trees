export class TreatmentDescription {
  constructor(
    public providerId: string,
    public runnerId: string,
    public description: string,
    public subTreatments: TreatmentDescription[] = [],
  ) {}
}

export class InterceptorTreatmentDescription {
  constructor(public description: string, public services: string[] = []) {}
}
export class InterceptorDescription {
  preTreatment?: InterceptorTreatmentDescription;
  postTreatment?: InterceptorTreatmentDescription;
}

export interface ServiceDescripiton {
  getPreTraitmentDescription?(): TreatmentDescription[];
  getPostTraitmentDescription?(): TreatmentDescription[];
}
