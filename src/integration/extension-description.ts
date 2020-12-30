export class TreatmentDescription {
  constructor(
    public providerId: string,
    public runnerId: string,
    public description: string,
    public subTreatments: TreatmentDescription[] = [],
  ) {}

  private getSubDescriptionLines(
    treatmentDescriptions: TreatmentDescription[],
    level = 0,
    result: string[] = [],
  ): string[] {
    for (const treatmentDescription of treatmentDescriptions) {
      this.getDescriptionLines(treatmentDescription, level + 1, result);
    }
    return result;
  }
  public get descriptionLines() {
    return this.getDescriptionLines();
  }

  private getDescriptionLines(
    treatmentDescription: TreatmentDescription = this,
    level = 0,
    result: string[] = [],
  ): string[] {
    let prepend = ' ';
    for (let i = 0; i < level; i++) {
      prepend += '   ';
    }
    prepend += '- ';
    result.push(
      prepend +
        treatmentDescription.description +
        ' (' +
        treatmentDescription.providerId +
        '.' +
        treatmentDescription.runnerId +
        ')',
    );
    this.getSubDescriptionLines(
      treatmentDescription.subTreatments,
      level,
      result,
    );
    return result;
  }
}

export class RunnerTreatmentDescription {
  constructor(public description: string, public services: string[] = []) {}
}

export class InterceptorDescription {
  preTreatment?: RunnerTreatmentDescription;
  postTreatment?: RunnerTreatmentDescription;
}

export interface ServiceDescripiton {
  getPreTraitmentDescription?(): TreatmentDescription[];
  getTraitmentDescription?(): TreatmentDescription[];
  getPostTraitmentDescription?(): TreatmentDescription[];
}
