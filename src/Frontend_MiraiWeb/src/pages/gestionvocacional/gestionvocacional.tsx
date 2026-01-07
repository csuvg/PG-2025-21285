import { useState } from 'react';
import { 
  Container, 
  Paper, 
  Text, 
  Group, 
  Stack,
  Grid,
  Button,
  TextInput,
  ActionIcon,
  Card,
  Badge,
  Avatar,
  Tooltip,
  ScrollArea,
  Tabs,
  Alert,
  Loader,
  Collapse,
  ThemeIcon
} from '@mantine/core';
import { 
  IconSchool,
  IconEye,
  IconSearch,
  IconAlertTriangle,
  IconChevronDown,
  IconLink,
  IconBook
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';
import { useUser } from '@clerk/clerk-react';

import logo from '../../assets/images/logomirai.png';
import Business from '../../assets/imgcarreras/International_marketing_and_business.png'
import Alimentos from '../../assets/imgcarreras/ing_alimentos.png'
import Biomolecular from '../../assets/imgcarreras/bio_molecular.png'
import Farmaceuticos from '../../assets/imgcarreras/farmaceuticos.png'
import Mecatronica from '../../assets/imgcarreras/ing_mecatronica.png'
import Bioindustrial from '../../assets/imgcarreras/bio_industrial.png'
import Diseñoproducto from '../../assets/imgcarreras/diseño_producto.png'
import Ingadministracion from '../../assets/imgcarreras/ing_administracion.png'
import Adminempresa from '../../assets/imgcarreras/admin_empresas.png'
import Ingarquitectonica from '../../assets/imgcarreras/ing_arquitectonica.png'
import IngBiomedica from '../../assets/imgcarreras/ing_biomedica.png'
import IngMecanica from '../../assets/imgcarreras/ing_mecanica.png'
import Licarquitectura from '../../assets/imgcarreras/Lic_arquitectura.png'
import Licbioquimica from '../../assets/imgcarreras/lic_bioquimica.png'
import Licfisica from '../../assets/imgcarreras/lic_fisica.png'
import Ingelectronica from '../../assets/imgcarreras/ing_electronica.png'
import Liccomunicacion from '../../assets/imgcarreras/lic_comunicacion.png'
import Licinternacional from '../../assets/imgcarreras/lic_internacional.png'
import Liccomputacional from '../../assets/imgcarreras/lic_computacional.png'
import Ingquimica from '../../assets/imgcarreras/ing_quimica.png'
import Ingquimicaindustrial from '../../assets/imgcarreras/ing_quimicaindustrial.png'
import Licaqueologia from '../../assets/imgcarreras/lic_arqueologia.png'
import Licbiologia from '../../assets/imgcarreras/lic_biologia.png'
import Licatropologia from '../../assets/imgcarreras/lic_antropologia.png'
import Ingsistemas from '../../assets/imgcarreras/ing_sistemas.png'
import Licquimica from '../../assets/imgcarreras/lic_quimica.png'
import Ingindustrial from '../../assets/imgcarreras/ing_industrial.png'
import Licmusical from '../../assets/imgcarreras/lic_musical.png'
import Licmate from '../../assets/imgcarreras/lic_mate.png'
import Licnutricion from '../../assets/imgcarreras/lic_nutricion.png'
import Ingmecanica2 from '../../assets/imgcarreras/ing_mecanica2.png'
import Licpiscologia from '../../assets/imgcarreras/lic_psicologia.png'
import Ingcivil from '../../assets/imgcarreras/ing_civil.png'

// Interfaces actualizadas para la API real
interface CareerFromAPI {
  _id: string;
  name: string;
  faculty: string;
  description: string;
  duration: number;
  employability: string;
}

interface CareersResponse {
  careers: CareerFromAPI[];
}

// Interfaces para el plan de estudios
interface Prerequisito {
  _id: string;
  nombre: string;
  prerequisitos?: (Prerequisito | string | null)[];
}

interface Subject {
  id: string;
  name: string;
  prerequisitos?: (Prerequisito | null)[];
}

interface Semester {
  primer_semestre: Subject[];
  segundo_semestre: Subject[];
}

interface StudyPlan {
  [key: string]: Semester;
}

interface PensumSubject {
  _id: string;
  nombre: string;
  prerequisitos: (Prerequisito | null)[];
}

interface PensumData {
  year: number;
  first_semester: PensumSubject[];
  second_semester: PensumSubject[];
}

interface CareerDetail {
  plan_de_estudio: StudyPlan;
  _id: string;
  nombre_carrera: string;
  facultad: string;
  descripcion: string;
  duracion: number;
  empleabilidad: string;
}

interface CareerDetailResponse {
  career: CareerDetail;
  pensum?: PensumData[];
}

interface Curso {
  id: number;
  nombre: string;
  descripcion: string;
  duracionSemanas: number;
  año: number;
  semestre: 1 | 2;
  creditos: number;
  imagen: string;
  carreraId: string;
  fechaCreacion: string;
}

interface Carrera {
  id: string;
  nombre: string;
  descripcion: string;
  duracionSemestres: number;
  modalidad: string;
  imagen: string;
  fechaCreacion: string;
  cursos: Curso[];
  facultad: string;
  empleabilidad: string;
}

// Mapeo de imágenes locales por ID de carrera
const careerImages: { [key: string]: string } = {
  '68e03f2bae67287b8834d111': Business,
  '68e03f2bae67287b8834d0ff': Alimentos,
  '68e03f2bae67287b8834d114': Biomolecular,
  '68e03f2bae67287b8834d116': Farmaceuticos,
  '68e03f2bae67287b8834d109': Mecatronica,
  '68e03f2bae67287b8834d100': Bioindustrial,
  '68e03f2bae67287b8834d11d': Diseñoproducto,
  '68e03f2bae67287b8834d102': Ingadministracion,
  '68e03f2bae67287b8834d10d': Adminempresa,
  '68e03f2bae67287b8834d101': Ingarquitectonica,
  '68e03f2bae67287b8834d0fe': IngBiomedica,
  '68e03f2bae67287b8834d10c': IngMecanica,
  '68e03f2bae67287b8834d10e': Licarquitectura,
  '68e03f2bae67287b8834d115': Licbioquimica,
  '68e03f2bae67287b8834d112': Licfisica,
  '68e03f2bae67287b8834d105': Ingelectronica,
  '68e03f2bae67287b8834d10b': Liccomunicacion,
  '68e03f2bae67287b8834d11e': Licinternacional,
  '68e03f2bae67287b8834d104': Liccomputacional,
  '68e03f2bae67287b8834d10f': Ingquimica,
  '68e03f2bae67287b8834d110': Ingquimicaindustrial,
  '68e03f2bae67287b8834d117': Licaqueologia,
  '68e03f2bae67287b8834d108': Licbiologia,
  '68e03f2bae67287b8834d118': Licatropologia,
  '68e03f2bae67287b8834d103': Ingsistemas,
  '68e03f2bae67287b8834d119': Licquimica,
  '68e03f2bae67287b8834d106': Ingindustrial,
  '68e03f2bae67287b8834d11c': Licmusical,
  '68e03f2bae67287b8834d11a': Licmate,
  '68e03f2bae67287b8834d11b': Licnutricion,
  '68e03f2bae67287b8834d10a': Ingmecanica2,
  '68e03f2bae67287b8834d113': Licpiscologia,
  '68e03f2bae67287b8834d107': Ingcivil,
};

const getCareerImage = (careerId: string): string => {
  return careerImages[careerId] || logo;
};

// Componente para renderizar un prerequisito individual con manejo de objetos y strings
const PrerequisiteItem = ({ prerequisito }: { prerequisito: Prerequisito }) => {
  const [expandedPrereqs, setExpandedPrereqs] = useState(false);
  
  // Filtrar prerequisitos válidos (objetos, no strings ni null)
  const validPrereqs = (prerequisito.prerequisitos || []).filter(
    (p): p is Prerequisito => typeof p === 'object' && p !== null
  );
  
  const hasNestedPrerequisites = validPrereqs.length > 0;

  return (
    <div key={prerequisito._id} style={{ marginLeft: '16px', marginBottom: '8px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.1), rgba(255, 175, 33, 0.05))',
        borderRadius: '6px',
        border: '1px solid rgba(75, 205, 246, 0.2)',
      }}>
        <ThemeIcon
          size="sm"
          color="blue"
          variant="light"
          style={{ minWidth: '24px' }}
        >
          <IconLink size={14} />
        </ThemeIcon>
        
        <Text size="sm" className="font-roboto font-semibold text-gray-800" style={{ flex: 1 }}>
          {prerequisito.nombre}
        </Text>

        {hasNestedPrerequisites && (
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            onClick={() => setExpandedPrereqs(!expandedPrereqs)}
          >
            <IconChevronDown
              size={12}
              style={{
                transform: expandedPrereqs ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease',
              }}
            />
          </ActionIcon>
        )}
      </div>

      {hasNestedPrerequisites && (
        <Collapse in={expandedPrereqs}>
          <div style={{ marginTop: '8px' }}>
            {validPrereqs.map((nested) => (
              <PrerequisiteItem key={nested._id} prerequisito={nested} />
            ))}
          </div>
        </Collapse>
      )}
    </div>
  );
};

// Componente para mostrar los prerequisitos de una materia (para pensum)
const SubjectPrerequisitesPensum = ({ prerequisites }: { prerequisites: (Prerequisito | null)[] }) => {
  const [showPrerequisites, setShowPrerequisites] = useState(false);
  
  // Filtrar solo objetos válidos (no nulls ni strings)
  const filteredPrerequisites = prerequisites.filter(
    (prereq): prereq is Prerequisito => typeof prereq === 'object' && prereq !== null
  );
  
  const hasPrerequisites = filteredPrerequisites.length > 0;

  if (!hasPrerequisites) return null;

  return (
    <div style={{ marginTop: '12px' }}>
      <Button
        variant="subtle"
        size="xs"
        leftSection={<IconBook size={14} />}
        rightSection={
          <IconChevronDown
            size={14}
            style={{
              transform: showPrerequisites ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
        }
        onClick={() => setShowPrerequisites(!showPrerequisites)}
        style={{
          color: '#4BCDF6',
          fontFamily: 'Roboto, sans-serif',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        {filteredPrerequisites.length} prerequisito{filteredPrerequisites.length !== 1 ? 's' : ''}
      </Button>

      <Collapse in={showPrerequisites}>
        <div style={{ marginTop: '12px', paddingLeft: '8px', borderLeft: '2px solid #4BCDF6' }}>
          <Text size="xs" className="font-roboto font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Materias requeridas:
          </Text>
          <Stack gap="xs">
            {filteredPrerequisites.map((prereq) => (
              <PrerequisiteItem key={prereq._id} prerequisito={prereq} />
            ))}
          </Stack>
        </div>
      </Collapse>
    </div>
  );
};

// Componente para mostrar los prerequisitos de una materia (para plan_de_estudio)
const SubjectPrerequisites = ({ subject }: { subject: Subject }) => {
  const [showPrerequisites, setShowPrerequisites] = useState(false);
  
  const filteredPrerequisites = (subject.prerequisitos || []).filter(
    (prereq): prereq is Prerequisito => prereq !== null && prereq !== undefined
  );
  
  const hasPrerequisites = filteredPrerequisites.length > 0;

  if (!hasPrerequisites) return null;

  return (
    <div style={{ marginTop: '12px' }}>
      <Button
        variant="subtle"
        size="xs"
        leftSection={<IconBook size={14} />}
        rightSection={
          <IconChevronDown
            size={14}
            style={{
              transform: showPrerequisites ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
        }
        onClick={() => setShowPrerequisites(!showPrerequisites)}
        style={{
          color: '#4BCDF6',
          fontFamily: 'Roboto, sans-serif',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        {filteredPrerequisites.length} prerequisito{filteredPrerequisites.length !== 1 ? 's' : ''}
      </Button>

      <Collapse in={showPrerequisites}>
        <div style={{ marginTop: '12px', paddingLeft: '8px', borderLeft: '2px solid #4BCDF6' }}>
          <Text size="xs" className="font-roboto font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Materias requeridas:
          </Text>
          <Stack gap="xs">
            {filteredPrerequisites.map((prereq) => (
              <PrerequisiteItem key={prereq._id} prerequisito={prereq} />
            ))}
          </Stack>
        </div>
      </Collapse>
    </div>
  );
};

export default function Gestionvocacional() {
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const { user: clerkUser } = useUser();
  const [selectedCarrera, setSelectedCarrera] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const userCareerIds = (clerkUser?.unsafeMetadata?.careersId as string[]) || [];
  const hasAssignedCareers = userCareerIds.length > 0;

  const { data: careersData, isLoading: careersLoading, error: careersError } = useQuery({
    queryKey: ['careers', userCareerIds],
    queryFn: async (): Promise<CareersResponse> => {
      const response = await authenticatedFetch('https://api.miraiedu.online/careers');
      
      if (!response.ok) {
        throw new Error('Error al obtener las carreras');
      }
      
      const data = await response.json();
      
      if (hasAssignedCareers && data.careers) {
        const filteredCareers = data.careers.filter((career: CareerFromAPI) => 
          userCareerIds.includes(career._id)
        );
        return { careers: filteredCareers };
      }
      
      return data;
    },
  });

  const { data: careerDetailData, isLoading: careerDetailLoading, error: careerDetailError } = useQuery({
    queryKey: ['career-detail', selectedCarrera],
    queryFn: async (): Promise<CareerDetailResponse> => {
      if (!selectedCarrera) throw new Error('No hay carrera seleccionada');
      
      const response = await authenticatedFetch(`https://api.miraiedu.online/careers/${selectedCarrera}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener el detalle de la carrera');
      }
      
      return response.json();
    },
    enabled: !!selectedCarrera,
  });

  const carreras: Carrera[] = careersData?.careers?.map((career) => ({
    id: career._id,
    nombre: career.name,
    descripcion: career.description,
    duracionSemestres: career.duration * 2,
    modalidad: 'Presencial',
    imagen: getCareerImage(career._id),
    fechaCreacion: '2024-01-15',
    cursos: [],
    facultad: career.faculty,
    empleabilidad: career.employability
  })) || [];

  const filteredCarreras = carreras.filter(carrera =>
    carrera.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    carrera.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewCarrera = (carreraId: string) => {
    navigate(`/app/infovocacional?type=carrera&id=${carreraId}`);
  };

  const renderStudyPlanFromPensum = () => {
    const pensumData = careerDetailData?.pensum;

    if (!pensumData || pensumData.length === 0) return null;

    return (
      <Stack gap="lg">
        <Paper p="lg" shadow="sm" radius="md" style={{ 
          border: '1px solid rgba(75, 205, 246, 0.1)',
          background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.05), rgba(255, 54, 159, 0.02))'
        }}>
          <Group justify="space-between" mb="md">
            <div>
              <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
                PLAN DE ESTUDIOS
              </Text>
              <Text className="font-roboto text-gray-600 text-sm">
                {careerDetailData.career.nombre_carrera} • {careerDetailData.career.facultad}
              </Text>
            </div>
            <Badge variant="light" color="blue">
              {pensumData.length} años
            </Badge>
          </Group>
        </Paper>

        <Tabs defaultValue={`year-${pensumData[0]?.year || 1}`} variant="outline">
          <Tabs.List>
            {pensumData.map((yearData) => (
              <Tabs.Tab 
                key={`year-${yearData.year}`}
                value={`year-${yearData.year}`}
                styles={{
                  tab: {
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&[data-active]': {
                      borderColor: '#4BCDF6',
                      color: '#4BCDF6'
                    }
                  }
                }}
              >
                Año {yearData.year}
              </Tabs.Tab>
            ))}
          </Tabs.List>

            {pensumData.map((yearData) => (
              <Tabs.Panel key={`year-${yearData.year}`} value={`year-${yearData.year}`} pt="lg">
                <Grid>
                  {/* Primer Semestre */}
                  <Grid.Col span={6}>
                    <Paper p="md" shadow="sm" radius="md" style={{ border: '1px solid rgba(159, 139, 234, 0.2)' }}>
                      <Group justify="space-between" mb="md">
                        <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                          PRIMER SEMESTRE
                        </Text>
                        <Badge size="sm" color="violet">
                          {yearData.first_semester.length} materias
                        </Badge>
                      </Group>
                      
                      <Stack gap="md">
                        {yearData.first_semester.map((subject, index) => (
                          <Card key={subject._id} p="md" className="hover:shadow-md transition-shadow" style={{
                            border: '1px solid rgba(159, 139, 234, 0.1)',
                            background: 'linear-gradient(135deg, rgba(159, 139, 234, 0.05), rgba(255, 255, 255, 0.5))'
                          }}>
                            <Group gap="sm" mb="sm">
                              <Avatar
                                size="sm"
                                style={{
                                  background: 'linear-gradient(135deg, #9F8BEA, #FFAF21)'
                                }}
                              >
                                <Text size="xs" c="white" fw={600}>
                                  {index + 1}
                                </Text>
                              </Avatar>
                              <div style={{ flex: 1 }}>
                                <Text className="font-roboto font-semibold text-sm text-gray-800">
                                  {subject.nombre}
                                </Text>
                              </div>
                            </Group>
                            <SubjectPrerequisitesPensum prerequisites={subject.prerequisitos} />
                          </Card>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid.Col>

                  {/* Segundo Semestre */}
                  <Grid.Col span={6}>
                    <Paper p="md" shadow="sm" radius="md" style={{ border: '1px solid rgba(255, 175, 33, 0.2)' }}>
                      <Group justify="space-between" mb="md">
                        <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                          SEGUNDO SEMESTRE
                        </Text>
                        <Badge size="sm" color="orange">
                          {yearData.second_semester.length} materias
                        </Badge>
                      </Group>
                      
                      <Stack gap="md">
                        {yearData.second_semester.map((subject, index) => (
                          <Card key={subject._id} p="md" className="hover:shadow-md transition-shadow" style={{
                            border: '1px solid rgba(255, 175, 33, 0.1)',
                            background: 'linear-gradient(135deg, rgba(255, 175, 33, 0.05), rgba(255, 255, 255, 0.5))'
                          }}>
                            <Group gap="sm" mb="sm">
                              <Avatar
                                size="sm"
                                style={{
                                  background: 'linear-gradient(135deg, #FFAF21, #FF369F)'
                                }}
                              >
                                <Text size="xs" c="white" fw={600}>
                                  {index + 1}
                                </Text>
                              </Avatar>
                              <div style={{ flex: 1 }}>
                                <Text className="font-roboto font-semibold text-sm text-gray-800">
                                  {subject.nombre}
                                </Text>
                              </div>
                            </Group>
                            <SubjectPrerequisitesPensum prerequisites={subject.prerequisitos} />
                          </Card>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>
            ))}
        </Tabs>
      </Stack>
    );
  };

  const renderStudyPlan = () => {
    // Intentar usar pensum primero
    if (careerDetailData?.pensum && careerDetailData.pensum.length > 0) {
      return renderStudyPlanFromPensum();
    }

    // Fallback a plan_de_estudio
    if (!careerDetailData?.career?.plan_de_estudio) return null;

    const studyPlan = careerDetailData.career.plan_de_estudio;
    const years = Object.keys(studyPlan).sort();

    return (
      <Stack gap="lg">
        <Paper p="lg" shadow="sm" radius="md" style={{ 
          border: '1px solid rgba(75, 205, 246, 0.1)',
          background: 'linear-gradient(135deg, rgba(75, 205, 246, 0.05), rgba(255, 54, 159, 0.02))'
        }}>
          <Group justify="space-between" mb="md">
            <div>
              <Text className="font-bebas text-xl text-[#1D1A05] tracking-wide">
                PLAN DE ESTUDIOS
              </Text>
              <Text className="font-roboto text-gray-600 text-sm">
                {careerDetailData.career.nombre_carrera} • {careerDetailData.career.facultad}
              </Text>
            </div>
            <Badge variant="light" color="blue">
              {years.length} años
            </Badge>
          </Group>
        </Paper>

        <Tabs defaultValue={years[0]} variant="outline">
          <Tabs.List>
            {years.map((year, index) => (
              <Tabs.Tab 
                key={year} 
                value={year}
                styles={{
                  tab: {
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    '&[data-active]': {
                      borderColor: '#4BCDF6',
                      color: '#4BCDF6'
                    }
                  }
                }}
              >
                Año {index + 1}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {years.map((year) => (
            <Tabs.Panel key={year} value={year} pt="lg">
              <Grid>
                {/* Primer Semestre */}
                <Grid.Col span={6}>
                  <Paper p="md" shadow="sm" radius="md" style={{ border: '1px solid rgba(159, 139, 234, 0.2)' }}>
                    <Group justify="space-between" mb="md">
                      <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                        PRIMER SEMESTRE
                      </Text>
                      <Badge size="sm" color="violet">
                        {studyPlan[year].primer_semestre.length} materias
                      </Badge>
                    </Group>
                    
                    <Stack gap="md">
                      {studyPlan[year].primer_semestre.map((subject, index) => (
                        <Card key={subject.id} p="md" className="hover:shadow-md transition-shadow" style={{
                          border: '1px solid rgba(159, 139, 234, 0.1)',
                          background: 'linear-gradient(135deg, rgba(159, 139, 234, 0.05), rgba(255, 255, 255, 0.5))'
                        }}>
                          <Group gap="sm" mb="sm">
                            <Avatar
                              size="sm"
                              style={{
                                background: 'linear-gradient(135deg, #9F8BEA, #FFAF21)'
                              }}
                            >
                              <Text size="xs" c="white" fw={600}>
                                {index + 1}
                              </Text>
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <Text className="font-roboto font-semibold text-sm text-gray-800">
                                {subject.name}
                              </Text>
                            </div>
                          </Group>
                          <SubjectPrerequisites subject={subject} />
                        </Card>
                      ))}
                    </Stack>
                  </Paper>
                </Grid.Col>

                {/* Segundo Semestre */}
                <Grid.Col span={6}>
                  <Paper p="md" shadow="sm" radius="md" style={{ border: '1px solid rgba(255, 175, 33, 0.2)' }}>
                    <Group justify="space-between" mb="md">
                      <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                        SEGUNDO SEMESTRE
                      </Text>
                      <Badge size="sm" color="orange">
                        {studyPlan[year].segundo_semestre.length} materias
                      </Badge>
                    </Group>
                    
                    <Stack gap="md">
                      {studyPlan[year].segundo_semestre.map((subject, index) => (
                        <Card key={subject.id} p="md" className="hover:shadow-md transition-shadow" style={{
                          border: '1px solid rgba(255, 175, 33, 0.1)',
                          background: 'linear-gradient(135deg, rgba(255, 175, 33, 0.05), rgba(255, 255, 255, 0.5))'
                        }}>
                          <Group gap="sm" mb="sm">
                            <Avatar
                              size="sm"
                              style={{
                                background: 'linear-gradient(135deg, #FFAF21, #FF369F)'
                              }}
                            >
                              <Text size="xs" c="white" fw={600}>
                                {index + 1}
                              </Text>
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <Text className="font-roboto font-semibold text-sm text-gray-800">
                                {subject.name}
                              </Text>
                            </div>
                          </Group>
                          <SubjectPrerequisites subject={subject} />
                        </Card>
                      ))}
                    </Stack>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>
          ))}
        </Tabs>
      </Stack>
    );
  };

  if (careersLoading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader size="xl" color="#4BCDF6" />
          <Text className="font-roboto text-gray-600 mt-4 text-lg">
            Cargando carreras...
          </Text>
        </div>
      </div>
    );
  }

  if (careersError) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
        <Alert 
          color="red" 
          title="Error al cargar las carreras"
          icon={<IconAlertTriangle size={16} />}
          style={{ maxWidth: 500 }}
        >
          <Text className="font-roboto mb-4">
            Hubo un problema al cargar las carreras. Por favor, intenta recargar la página.
          </Text>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['careers'] })}
            variant="outline"
            color="red"
          >
            Reintentar
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <Container size="xl" className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Text className="font-bebas text-4xl text-[#1D1A05] tracking-wide mb-2">
                GESTIÓN DE CARRERAS Y CURSOS
              </Text>
              <Text className="font-roboto text-gray-600 text-lg">
                Administra el catálogo académico de la institución
              </Text>
            </div>
          </div>
        </Container>
      </div>

      <Container size="xl" className="p-6">
        <Grid>
          {/* Sidebar de carreras */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper p="lg" shadow="sm" radius="md" style={{ border: '1px solid rgba(75, 205, 246, 0.1)' }}>
              <Group justify="space-between" mb="md">
                <Text className="font-bebas text-lg text-[#1D1A05] tracking-wide">
                  CARRERAS DISPONIBLES
                </Text>
                <Badge variant="light" color="blue">
                  {filteredCarreras.length}
                </Badge>
              </Group>
              
              <TextInput
                placeholder="Buscar carreras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                leftSection={<IconSearch size={16} color="#4BCDF6" />}
                mb="md"
                styles={{
                  input: {
                    fontFamily: 'Roboto, sans-serif',
                    border: '2px solid #f0f0f0',
                    '&:focus': { borderColor: '#4BCDF6' }
                  }
                }}
              />
              
              <ScrollArea style={{ height: '70vh' }}>
                <Stack gap="sm">
                  {filteredCarreras.map((carrera) => (
                    <Card
                      key={carrera.id}
                      p="md"
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedCarrera === carrera.id 
                          ? 'border-2 border-blue-400 bg-blue-50' 
                          : 'border border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCarrera(carrera.id)}
                    >
                      <Group>
                        <Avatar
                          src={carrera.imagen}
                          size="md"
                          style={{
                            background: 'linear-gradient(135deg, #4BCDF6, #FF369F)'
                          }}
                        >
                          <IconSchool size={20} />
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Text className="font-roboto font-semibold text-sm text-gray-800">
                            {carrera.nombre}
                          </Text>
                          <Group gap="xs">
                            <Badge size="xs" color="blue" variant="light">
                              {carrera.duracionSemestres / 2} años
                            </Badge>
                            <Badge size="xs" color="green" variant="light">
                              {carrera.empleabilidad}
                            </Badge>
                          </Group>
                        </div>
                        <Group gap={2}>
                          <Tooltip label="Ver detalles">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="blue"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCarrera(carrera.id);
                              }}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            </Paper>
          </Grid.Col>

          {/* Área principal - Plan de estudios */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            {!selectedCarrera ? (
              <Paper p="xl" shadow="sm" radius="md" className="text-center">
                <IconSchool size={64} color="#9ca3af" style={{ margin: '0 auto' }} />
                <Text className="font-bebas text-xl text-gray-500 mt-4 mb-2">
                  SELECCIONA UNA CARRERA
                </Text>
                <Text className="font-roboto text-gray-400">
                  Elige una carrera del panel izquierdo para ver su plan de estudios
                </Text>
              </Paper>
            ) : careerDetailLoading ? (
              <Paper p="xl" shadow="sm" radius="md" className="text-center">
                <Loader size="xl" color="#4BCDF6" />
                <Text className="font-roboto text-gray-600 mt-4 text-lg">
                  Cargando plan de estudios...
                </Text>
              </Paper>
            ) : careerDetailError ? (
              <Paper p="xl" shadow="sm" radius="md" className="text-center">
                <Alert 
                  color="red" 
                  title="Error al cargar el plan de estudios"
                  icon={<IconAlertTriangle size={16} />}
                >
                  <Text className="font-roboto mb-4">
                    No se pudo cargar el plan de estudios de esta carrera.
                  </Text>
                  <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['career-detail', selectedCarrera] })}
                    variant="outline"
                    color="red"
                  >
                    Reintentar
                  </Button>
                </Alert>
              </Paper>
            ) : (
              renderStudyPlan()
            )}
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
}