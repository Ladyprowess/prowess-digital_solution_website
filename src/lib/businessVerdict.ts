export function businessVerdict(values: number[]) {
 if(values.length!==5||values.some(v=>![0,1,2].includes(v)))return null;
 const missing=values.filter(v=>v===0).length;
 const partial=values.filter(v=>v===1).length;
 if(missing>=3)return {name:'Foundations need attention',description:`${missing} of five practices are missing. Essential parts of the operation are not yet in place. Start by establishing these before adding complexity.`};
 if(missing)return {name:'Working with critical gaps',description:`${missing} practice${missing===1?' is':'s are'} missing${partial?` and ${partial} need greater consistency`:''}. Some parts are in place, but the gaps can interrupt reliable delivery.`};
 if(partial)return {name:'Working, but inconsistent',description:`All five practices exist, but ${partial} depend on informal or inconsistent execution. Focus on making those steps repeatable.`};
 return {name:'Structured and repeatable',description:'All five practices are reported as established and consistently followed. Maintain them and test that they work in real situations.'};
}
